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
        new item.view.controls.MultiSelect({
            $container:$(`<div></div>`).appendTo($container),
            items: new item.controllers.db.Collection({
                connection:()=>connection,
                schema:{
                    ".name":{ type:item.types.primitives.String },
                    ".pattern":{type:item.types.primitives.String},
                    ".path":{type:item.types.primitives.String}
                },
                data:[".folder","=","$oid('/root/FP/PROJECT')"]
            }),
            itemText: ".name",
            itemValue: ".path"
        });
    }
}
