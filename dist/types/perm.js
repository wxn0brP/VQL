export var PermCRUD;
(function (PermCRUD) {
    PermCRUD[PermCRUD["CREATE"] = 1] = "CREATE";
    PermCRUD[PermCRUD["READ"] = 2] = "READ";
    PermCRUD[PermCRUD["UPDATE"] = 4] = "UPDATE";
    PermCRUD[PermCRUD["DELETE"] = 8] = "DELETE";
    PermCRUD[PermCRUD["COLLECTION"] = 16] = "COLLECTION";
})(PermCRUD || (PermCRUD = {}));
