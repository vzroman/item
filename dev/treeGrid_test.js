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

        const controller = new item.controllers.db.Collection({...options,data:[".folder","=","$oid('/root/PROJECT')"]});

        const grid = new item.view.collections.TreeGrid({
            $container,
            data:controller,
            columns:[".name",".pattern"],    // string | { fields, handler } | Item }
            header:["name", "pattern"],                    // string | Item | function -> string | $markup
            resizable:true,
            numerated:true,
            multiselect:true,
            checkbox:true,
            pager:{},
            //row:{ links:{ selected:{source:"data@.name", handler:name=> name === "chemical" } }},
            itemName:(item)=>item[".name"],
            isFolder:( any )=> true,
            getIcon:( item ) => false,
            getSubitems:( folder )=>{
                return new item.controllers.db.Collection({...options, data:[".folder","=","$oid('"+folder[".path"]+"')"]})
            },
            events:{
                onSelect:items => {
                    console.log("onSelect", items)
                }
            }
        });

    }
}
