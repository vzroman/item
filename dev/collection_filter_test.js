import {item} from "../dist/item.js";

export function run( $container ) {

    const controller = new item.controllers.Collection({
        id: "id",
        schema:{
            ".name":{ type:item.types.primitives.String },
            "age":{type:item.types.primitives.Integer},
            "car":{type:item.types.primitives.String}
        },
        data: [
            {"id": 1, ".name": "Dalen", "age": 23, "car": "BMW"},
            {"id": 2,".name": "Alex", "age": 21, "car": "Lexus"},
            {"id": 3,".name": "Mereke", "age": 23, "car": "Toyota"},
            {"id": 4,".name": "Martin", "age": 23, "car": "BMW"},
            {"id": 5,".name": "Mereke", "age": 25, "car": "Audi"},
            {"id": 6,".name": "Dalen", "age": 25, "car": "Zeekr"},
            {"id": 7,".name": "Dalen", "age": 18, "car": "Porsche"}
        ]
    });


    let filter = ["or", [
      [".name", "=", "Dalen"],
      ["and", [
          ["age", "=", 23],
          ["car", "=", "Audi"]
      ]]
    ]];

    let filter1 = ["and", [
      [".name", "=", "Mereke"],
      ["or", [
        ["and", [
          ["car", "=", "BMW"],
          ["age", "=", 25]
        ]],
        ["age", "=", 23]
      ]]
    ]];

    let filter2 = ["andnot", [
      ["and", [
        [".name", "=", "Mereke"],
        ["age", ">", 23]
      ]],
      ["car", "=", "Lada"]
    ]];

    filter2 = ["or", [
      filter2,
      ["and", [
        [".name", "=", "Dalen"],
        ["or", [
          ["age", "<", 19],
          ["age", ">", 23]
        ]]
      ]],
      [".name", "=", "Jack"]
    ]];

    controller.option("filter", filter);

    setTimeout(() => {
      controller.option("filter", filter1);
    }, 2000);

    setTimeout(() => {
        controller.option("filter", filter2);

        setTimeout(() => {
            controller.set({8: { "id": 8,".name": "Jack", "age": 20, "car": "Tesla" }});
            setTimeout(() => {
                controller.option("filter", null);
            }, 1000)
        }, 2000);
    }, 5000);

    const grid = new item.view.collections.Grid({
        $container,
        data:controller,
        columns:[".name","age", "car"],
        header: ["Name", "Age", "Car"],
        resizable:true,
        numerated:true,
        multiselect:true,
        checkbox:true
    });
}