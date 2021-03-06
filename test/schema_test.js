const { Schema, Record, Relationship } = require("../src");

describe("Schema", () => {
  class User extends Record {}

  let schema;

  beforeEach(() => {
    Schema.instances.splice(0,999); // clear out
    schema = new Schema({url: "smth://localhost:1234/blah"});
  });

  describe(".findFor(Model)", () => {
    it("returns the schema instance that owns the model", () => {
      schema.create("User", {username: String});
      expect(Schema.findFor(User)).to.equal(schema);
    });

    it("blows up when there is no schema registered for the model", () => {
      expect(() => Schema.findFor(User)).to.throw(
        "Can't find a schema that owns User!"
      );
    });
  });

  describe("instance", () => {
    it("is a Schema", () => {
      expect(schema).to.be.instanceOf(Schema);
    });

    it("has a connection object stuck with it", () => {
      expect(schema.connection).to.eql({url: "smth://localhost:1234/blah"});
    });

    it("has an empty list of models", () => {
      expect(schema.models).to.eql([]);
    });

    it("must be registered in the schema instances registery", () => {
      expect(Schema.instances).to.eql([schema]);
    });
  });

  describe("#owns(Model)", () => {
    it("says `true` when the model is registered against the schema", () => {
      schema.create("User", {username: String});
      expect(schema.owns(User)).to.be.true;
    });

    it("says `false` when the model is not registered with the schema", () => {
      expect(schema.owns(User)).to.be.false;
    });
  });

  describe("#getParams(Model)", () => {
    it("returns the params hash for a Model when it's registered against the schema", () => {
      schema.create("User", {username: String});
      expect(schema.getParams(User)).to.eql(schema.models[0]);
    });

    it("returns `undefined` when the model is not regestered", () => {
      expect(schema.getParams(User)).to.be.undefined;
    });
  });

  describe("#create(name, attributes)", () => {
    it("saves the name and attributes in the schema", () => {
      schema.create("User", {username: String});
      expect(schema.models).to.eql([
        {
          name:       "User",
          table:      "users",
          attributes: {
            id:       {type: String},
            username: {type: String}
          },
          relationships: {}
        }
      ]);
    });

    it("handles the belongsTo references", () => {
      schema.create("User", {username: String});
      schema.create("Post", {text: String, author: "User"});

      expect(schema.models).to.eql([
        {
          name: "User",
          table: "users",
          attributes: {
            id:       {type: String},
            username: {type: String}
          },
          relationships: {}
        }, {
          name: "Post",
          table: "posts",
          attributes: {
            id:     {type: String},
            text:   {type: String},
            userId: {type: String}
          },
          relationships: {
            author: new Relationship({
              type:       "belongs-to",
              model:      "User",
              primaryKey: "id",
              foreignKey: "userId"
            })
          }
        }
      ]);
    });

    it("handles the hasMany relationships", () => {
      schema.create("Post", { text: String });
      schema.create("User", {
        username: String,
        posts: ["Post"]
      });

      expect(schema.models).to.eql([
        {
          name: "Post",
          table: "posts",
          attributes: {
            id:     {type: String},
            text:   {type: String}
            // userId: {type: String}
          },
          relationships: {
            // author: new Relationship({
            //   type:       "belongs-to",
            //   model:      "User",
            //   primaryKey: "id",
            //   foreignKey: "userId"
            // })
          }
        }, {
          name:  "User",
          table: "users",
          attributes: {
            id:       {type: String},
            username: {type: String}
          },
          relationships: {
            posts: new Relationship({
              type:       "has-many",
              model:      "Post",
              primaryKey: "id",
              foreignKey: "userId"
            })
          }
        }
      ]);
    });

    // it("handles the hasMany relationships regardless of the definitions order", () => {
    //   schema.create("User", {
    //     username: String,
    //     posts: ["Post"]
    //   });
    //   schema.create("Post", { text: String });
    //
    //   expect(schema.models).to.eql([
    //     {
    //       name:  "User",
    //       table: "users",
    //       attributes: {
    //         username: String
    //       },
    //       relationships: {
    //         posts: new Relationship({
    //           type:       "has-many",
    //           model:      "Post",
    //           primaryKey: "id",
    //           foreignKey: "userId"
    //         })
    //       }
    //     }, {
    //       name: "Post",
    //       table: "posts",
    //       attributes: {
    //         text:   String,
    //         userId: String
    //       },
    //       relationships: {
    //         author: new Relationship({
    //           type:       "belongs-to",
    //           model:      "User",
    //           primaryKey: "id",
    //           foreignKey: "userId"
    //         })
    //       }
    //     }
    //   ]);
    // });
  });
});
