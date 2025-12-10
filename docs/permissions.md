# Uprawnienia w VQL

VQL implementuje wysoce elastyczny i potężny programistyczny system uprawnień. Zamiast statycznych reguł zdefiniowanych w schemacie, VQL pozwala na wstrzyknięcie **funkcji walidacji uprawnień (`permValidFn`)** bezpośrednio do `VQLProcessor`. Funkcja ta jest wywoływana dla każdego pola, do którego uzyskiwany jest dostęp, dając Ci szczegółową, dynamiczną kontrolę nad bezpieczeństwem Twoich danych.

Aby uprościć tworzenie tej funkcji walidacyjnej, VQL dostarcza `PermissionResolverEngine`.

## `PermissionResolverEngine`: Rdzeń Logiki Niestandardowej

`PermissionResolverEngine` to klasa pomocnicza, która pozwala budować zaawansowaną funkcję `permValidFn` poprzez rejestrowanie niestandardowych funkcji resolvera, które są dopasowywane do ścieżek dostępu do danych.

### Jak to działa

1.  **Stworzenie instancji Engine'u:** Utwórz nową instancję `PermissionResolverEngine`.
2.  **Dodawanie Resolverów:** Użyj metody `.addResolver()`, aby zarejestrować swoją logikę uprawnień. Każdy resolver jest sparowany z `matcherem`, który określa, kiedy powinien zostać wykonany.
3.  **Generowanie Funkcji Walidacyjnej:** Użyj metody `.create()` lub `.createWithGw()`, aby wygenerować ostateczną funkcję `permValidFn`.
4.  **Wstrzyknięcie do VQLProcessor:** Przekaż wygenerowaną funkcję do konstruktora `VQLProcessor`.

## Krok 1: Tworzenie `PermissionResolverEngine`

Najpierw zaimportuj i utwórz instancję silnika.

```typescript
import { PermissionResolverEngine } from "@wxn0brp/vql";

const resolverEngine = new PermissionResolverEngine();
```

## Krok 2: Dodawanie Resolverów

Tutaj definiujesz swoją logikę bezpieczeństwa. Metoda `.addResolver()` przyjmuje `matcher` i funkcję `resolver`.

### Matchery

`Matcher` informuje silnik, do których ścieżek danych resolver powinien być stosowany. Ścieżka to ciąg znaków, taki jak `kolekcja/pole` (np. `users/email`). Matcher może być:
-   **stringiem:** Dla dokładnego dopasowania ścieżki (np. `'users/password'`).
-   **RegExp:** Dla dopasowania opartego na wzorcu (np. `/email$/`, aby dopasować każde pole kończące się na "email").
-   **funkcją:** Dla złożonej, dynamicznej logiki dopasowania `(pathString: string, path: string[]) => boolean | Promise<boolean>`.

### Funkcja Resolvera

`Resolver` to funkcja `async`, która zwraca `true` (dostęp przyznany) lub `false` (dostęp zabroniony). Otrzymuje obiekt `PermValidFnArgs` z następującymi właściwościami:

-   `user`: Obiekt użytkownika przekazany do `processor.execute()`.
-   `path`: Bieżąca ścieżka danych jako tablica ciągów znaków.
-   `field`: Konkretne pole, do którego uzyskiwany jest dostęp.
-   `rootData`: Kompletny obiekt danych dla bieżącego przetwarzanego rekordu.
-   `p`: Argumenty uprawnień z zapytania (jeśli istnieją).

### Obsługa Błędów

Ważne jest, aby wiedzieć, że jeśli którakolwiek z funkcji resolvera zgłosi błąd podczas wykonania, `PermissionResolverEngine` automatycznie go przechwyci i odmówi dostępu do żądanej ścieżki. Zapewnia to, że nieoczekiwane błędy w logice uprawnień będą działać na zasadzie "fail-safe", zapobiegając przypadkowemu ujawnieniu danych. Powód odmowy (`via`) zostanie zgłoszony jako `'resolver-error'`.

### Przykład: Dodawanie Różnych Resolverów

```typescript
// Resolver 1: Blokowanie dostępu do dowolnego pola o nazwie 'password' za pomocą RegExp
resolverEngine.addResolver(/password$/, async (args) => {
    // Ten resolver po prostu odmawia dostępu, bez względu na to, kim jest użytkownik.
    return false;
});

// Resolver 2: Ograniczanie dostępu do pola 'email' za pomocą matchera stringowego
resolverEngine.addResolver("users/email", async (args) => {
    // Logika: Zezwalaj, jeśli użytkownik jest administratorem LUB jeśli prosi o własny e-mail.
    const { user, rootData } = args;
    if (user.role === 'admin') {
        return true;
    }
    if (user.id === rootData._id) {
        return true;
    }
    return false;
});

// Resolver 3: Matcher oparty na funkcji dla dowolnego pola w kolekcji 'logs'
const logsMatcher = (pathString, path) => path[0] === 'logs';
resolverEngine.addResolver(logsMatcher, async (args) => {
    // Logika: Tylko administratorzy mogą uzyskać dostęp do czegokolwiek w logach.
    return args.user.role === 'admin';
});
```

## Krok 3: Generowanie `permValidFn`

Silnik może wygenerować ostateczną funkcję walidacyjną na dwa sposoby.

### `create()`

Ta metoda tworzy `permValidFn`, która używa *tylko* dodanych przez Ciebie niestandardowych resolverów.

```typescript
const customPermValidFn = resolverEngine.create();
```

Jeśli dostęp do ścieżki danych nie pasuje do żadnego z Twoich resolverów, dostęp zostanie **odmówiony** (`granted: false, via: 'no-resolver-match'`).

### `createWithGw(gateWardenInstance)`

Ta metoda tworzy `permValidFn`, która najpierw próbuje Twoich niestandardowych resolverów. Jeśli żaden resolver nie pasuje do ścieżki, wraca do instancji `GateWarden`. Jest to idealne rozwiązanie do łączenia dynamicznych reguł opartych na ścieżkach z bardziej tradycyjnym systemem kontroli dostępu opartej na rolach (RBAC). Ważne jest, aby pamiętać, że jeśli resolver *pasuje* do ścieżki i jawnie zwraca `false`, dostęp jest natychmiast odmawiany, a instancja `GateWarden` **nie** jest konsultowana dla tej ścieżki.

```typescript
import { GateWarden } from "@wxn0brp/gate-warden";

// Załóżmy, że 'gw' jest w pełni skonfigurowaną instancją GateWarden
const gw = new GateWarden();
// ... dodaj role i uprawnienia do gw ...

// Utwórz funkcję walidacyjną, która używa niestandardowych resolverów i wraca do GateWarden
const combinedPermValidFn = resolverEngine.createWithGw(gw);
```

## Krok 4: Inicjalizacja `VQLProcessor`

Na koniec przekaż wygenerowaną funkcję `permValidFn` do konstruktora `VQLProcessor`.

```typescript
import { VQLProcessor, VQLConfig } from "@wxn0brp/vql";

// Załóżmy, że dbInstances i permValidFn są utworzone
const processor = new VQLProcessor(
    dbInstances,
    new VQLConfig(), // Opcjonalna konfiguracja
    combinedPermValidFn // Twoja wygenerowana funkcja uprawnień
);

// Teraz wszystkie wywołania processor.execute() będą chronione przez Twoje reguły
async function runQuery() {
    const userContext = { id: 'user123', role: 'editor' };
    const query = /* ... Twoje zapytanie VQLR lub VQLS ... */;

    // 'userContext' będzie dostępny wewnątrz Twoich resolverów uprawnień
    const result = await processor.execute(query, userContext);

    console.log(result);
}
```

To programistyczne podejście zapewnia solidny i wysoce adaptowalny model bezpieczeństwa, pozwalając na definiowanie złożonych reguł, które są oddzielone od logiki zapytań i schematów.
