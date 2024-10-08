
import {item} from "../dist/item.js";

export function run( $container ){
    // new item.view.controls.DatePicker({
    //     $container
    // });
    new item.view.widgets.Calendar({
        $container
    });

    // const data = new item.controllers.Collection({
    //     schema:{
    //         "su":{type:item.types.primitives.Integer},
    //         "mo":{type:item.types.primitives.Integer},
    //         "we":{type:item.types.primitives.Integer},
    //         "th":{type:item.types.primitives.Integer},
    //         "fr":{type:item.types.primitives.Integer},
    //         "sa":{type:item.types.primitives.Integer},
    //         "tu":{type:item.types.primitives.Integer}
    //     },
    //     data: [
    //         {"su": 1, "mo": 2, "tu": 3, "we": 4, "th": 5, "fr": 6, "sa": 7},
    //         {"su": 8, "mo": 9, "tu": 10, "we": 11, "th": 12, "fr": 13, "sa": 14},
    //         {"su": 15, "mo": 16, "tu": 17, "we": 18, "th": 19, "fr": 20, "sa": 21},
    //         {"su": 22, "mo": 23, "tu": 24, "we": 25, "th": 26, "fr": 27, "sa": 28},
    //         {"su": 29, "mo": 30, "tu": 31, "we": 1, "th": 2, "fr": 3, "sa": 4}
    //     ]
    // });

    // new item.view.collections.Grid({
    //     $container,
    //     header: ["SU", "MO", "TU", "WE", "TH", "FR", "SA"],
    //                 columns: ["su", "mo", "tu", "we", "th", "fr", "sa"],
    //                 data,
    // })
}