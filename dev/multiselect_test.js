import {Ecomet} from "./ecomet.js";
import {item} from "../dist/item.js";

export function run( $container ){

    const connection = new Ecomet();

    function connect(){
        console.debug("connecting...");
        connection.connect("127.0.0.1", 8000, "http:", ()=>{
            console.debug("connected, logging in...");
            connection.login("system", "111111", ()=>{

                console.debug("logged as system");

                doTest();

            },console.error);
        }, err=>{
            console.error( "connect error", err );
            setTimeout(connect, 1000);
        }, ()=>{
            console.error( "connection closes" );
            setTimeout(connect, 1000);
        });
    }

    connect();


    function doTest(){

        const options = {
            connection:()=>connection,
            schema:{
                ".name":{ type:item.types.primitives.String },
                ".pattern":{type:item.types.primitives.String},
                ".path":{type:item.types.primitives.String}
            },
            page:1,
            pageSize: 30,
        }
        const schema = {
            ".name":{ type:item.types.primitives.String },
            ".pattern":{type:item.types.primitives.String},
            ".path":{type:item.types.primitives.String}
        };

         // const a = new item.view.controls.SelectList({

                //     $container,
                //     items: ["item 1", "item 2", "item 3"],
                //     events:{
                //         value:(val)=>{
                //             console.log(val);
                //         }
                //     }
                // })
        
                const b = new item.view.controls.MultiSelect({
                    $container,
                    items: [{id: 1, text: "item 1"}, {id: 2, text: "item 2"}, {id: 3, text: "item 3"},{id: 4, text: "item 4"},{id: 5, text: "item 5"},{id: 6, text: "item 6"},{id: 7, text: "item 7"}],
                    itemText: "text",
                    itemValue: "id",
                    events:{
                        value:(val)=>{
                            console.log(111, val);
                        }
                    }
                })

                 // setTimeout(() => {
        //     a.set({value: ["item 2", "item 3"]})
        // }, 2000)

        setTimeout(() => {
            b.set({items: [{id: 1, text: "item 1"}, {id: 2, text: "item 2"}, {id: 3, text: "item 3"},{id: 4, text: "item 4"},{id: 5, text: "item 5"},{id: 6, text: "item 6"},{id: 7, text: "item 7"}]})
        }, 5000)


        // const grid = new item.view.collections.TreeGrid({
        //     $container,
        //     data:controller,
        //     columns:[".name",".pattern"],    // string | { fields, handler } | Item }
        //     header:["name", "pattern"],                    // string | Item | function -> string | $markup
        //     resizable:true,
        //     numerated:true,
        //     multiselect:true,
        //     checkbox:true,
        //     pager:{},
        //     itemName:(item)=>item[".name"],
        //     isFolder:( any )=> true,
        //     getIcon:( item ) => false,
        //     getSubitems:( folder )=>{
        //         return new item.controllers.db.Collection({...options, data:[".folder","=","$oid('"+folder[".path"]+"')"]})
        //     },
        //     events:{
        //         onSelect:items => {
        //             console.log("onSelect", items)
        //         }
        //     }
        // });
    }
}
