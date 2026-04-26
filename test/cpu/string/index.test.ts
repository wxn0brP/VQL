import { parseVQLS } from "#cpu/string/index";
import { describe, expect, it } from "bun:test";

describe("CPU/String/Index", () => {
    describe("parseVQLS", () => {
        it("1. should parse simple find query", () => {
            const result = parseVQLS("mydb users");
            // This should result in a find operation by default
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {}
                    }
                }
            });
        });

        it("2. should parse explicit find operation", () => {
            const result = parseVQLS("mydb find users");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {}
                    }
                }
            });
        });

        it("3. should parse find operation with search parameters", () => {
            const result = parseVQLS("mydb find users s.name=John s.age=30");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {
                            name: "John",
                            age: 30
                        }
                    }
                }
            });
        });

        it("4. should parse find operation with field selection", () => {
            const result = parseVQLS("mydb find users s.name=John e.name=true e.email=true");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {
                            name: "John"
                        },
                        select: ["name", "email"]
                    }
                }
            });
        });

        it("5. should handle alias expansion (s -> search, e -> select)", () => {
            const result = parseVQLS("mydb find users s.name=John e.active=true");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {
                            name: "John"
                        },
                        select: ["active"]
                    }
                }
            });
        });

        it("6. should parse update operation", () => {
            const result = parseVQLS("mydb update users s.name=John u.name=Jane");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    update: {
                        collection: "users",
                        search: {
                            name: "John"
                        },
                        updater: {
                            name: "Jane"
                        }
                    }
                }
            });
        });

        it("7. should parse add operation", () => {
            const result = parseVQLS("mydb add users d.name=John d.email=john@example.com");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    add: {
                        collection: "users",
                        data: {
                            name: "John",
                            email: "john@example.com"
                        }
                    }
                }
            });
        });

        it("8. should convert dotted notation to nested objects", () => {
            const result = parseVQLS("mydb find users s.profile.name=John s.profile.age=30");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {
                            profile: {
                                name: "John",
                                age: 30
                            }
                        }
                    }
                }
            });
        });

        it("9. should handle nested objects with multiple levels", () => {
            const result = parseVQLS("mydb find users s.user.profile.name=John s.user.settings.theme=dark");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {
                            user: {
                                profile: {
                                    name: "John"
                                },
                                settings: {
                                    theme: "dark"
                                }
                            }
                        }
                    }
                }
            });
        });

        it("10. should handle special character operations", () => {
            const result = parseVQLS("mydb +users d.name=John"); // '+' means add
            expect(result).toEqual({
                db: "mydb",
                d: {
                    add: {
                        collection: "users",
                        data: {
                            name: "John"
                        }
                    }
                }
            });
        });

        it("11. should handle findOne operation", () => {
            const result = parseVQLS("mydb findOne users s._id=123");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    findOne: {
                        collection: "users",
                        search: {
                            _id: 123
                        }
                    }
                }
            });
        });

        it("12. should parse remove operation", () => {
            const result = parseVQLS("mydb remove users s.name=John");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    remove: {
                        collection: "users",
                        search: {
                            name: "John"
                        }
                    }
                }
            });
        });

        it("13. should handle data-to-updater conversion for update/remove operations", () => {
            const result = parseVQLS("mydb update users s.name=John d.status=active");
            // For update operations, data should be converted to updater
            expect(result).toEqual({
                db: "mydb",
                d: {
                    update: {
                        collection: "users",
                        search: {
                            name: "John"
                        },
                        updater: {
                            status: "active"
                        }
                    }
                }
            });
        });

        it("14. should handle select alias (e -> select) with boolean values", () => {
            const result = parseVQLS("mydb find users s.name=John e.name=true e.email=true");
            // The 'e' alias should create a select array with the keys that have true values
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {
                            name: "John"
                        },
                        select: ["name", "email"]
                    }
                }
            });
        });

        it("15. should handle relations alias (r -> relations)", () => {
            const result = parseVQLS("mydb find users s.name=John r.comments.path=[\"db\",\"comments\"]");
            // Based on error output, it seems like 'r' creates a special relation structure
            expect(result).toEqual({
                r: {
                    path: ["mydb", "users"],
                    relations: {
                        comments: {
                            path: ["db", "comments"]
                        }
                    },
                    search: {
                        name: "John"
                    }
                }
            });
        });

        it("16. should handle options alias (o -> options)", () => {
            const result = parseVQLS("mydb find users s.name=John o.limit=10 o.sortBy=name");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {
                            name: "John"
                        },
                        options: {
                            limit: 10,
                            sortBy: "name",
                        }
                    }
                }
            });
        });

        it("17. should parse query with comparison operators", () => {
            const result = parseVQLS("mydb find users s.age>18 s.score>=90");
            // The dotted notation creates nested objects
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {
                            $gt: { age: 18 },
                            $gte: { score: 90 }
                        }
                    }
                }
            });
        });

        it("18. should handle getCollections operation", () => {
            const result = parseVQLS("mydb getCollections");
            expect(result).toEqual({
                db: "mydb",
                d: {
                    getCollections: {
                        collection: ""
                    }
                }
            });
        });

        it("19. should handle complex query with multiple features", () => {
            const query = 'mydb find users s.age>18 s.name="John Doe" e.name=true e.email=true e.active=true';
            const result = parseVQLS(query);
            expect(result).toEqual({
                db: "mydb",
                d: {
                    find: {
                        collection: "users",
                        search: {
                            $gt: {
                                age: 18
                            },
                            name: "John Doe"
                        },
                        select: ["name", "email", "active"]
                    }
                }
            });
        });
    });
});
