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

        const controller = new item.controllers.db.Collection({
            connection:()=>connection,
            schema:{
                ".name":{ type:item.types.primitives.String },
                ".pattern":{type:item.types.primitives.String}
            },
            data:["and",[
                [".folder",'=',"some folder"],
                ["or",[

                ]]
            ]]
        });

        const grid = new item.view.collections.Grid({
            $container,
            data:controller,
            columns:[".name",".pattern"],    // string | { fields, handler } | Item }
            header:["name", "pattern"],                    // string | Item | function -> string | $markup
            resizable:true,
            numerated:true,
            multiselect:true,
            checkbox:true,
            pager:{}
            // isFolder:{type:types.primitives.Any},
            // getIcon:{type:types.primitives.Any},
            // getSubitems:{type:types.primitives.Any}
        });
        const filter = ["and",[
            [".folder",'=',"some folder"],
            ["or",[

            ]]
        ]]
        controller.init([".folder","=","$oid('/root/PROJECT/LOCALIZATION')"]);

    }
}
