import {Ecomet} from "./ecomet.js";
import {item} from "../dist/item.js";

$(function () {

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
        const $container = $(`<div name="container" style="width: 80vw; height: 80vh"></div>`)
            .appendTo( $(`<div style="width: 100%; height: 100%; display: flex; justify-content: center;align-items: center"></div>`)
                .appendTo( $('body').css({width:"100%",height:"100%"})));

        const controller = new item.controllers.db.Collection({
            connection:()=>connection,
            schema:{
                ".name":{ type:item.types.primitives.String },
                ".pattern":{type:item.types.primitives.String}
            }
        });

        const grid = new item.view.collections.Grid({
            $container,
            data:controller,
            columns:[".name",".pattern"],    // string | { fields, handler } | Item }
            header:["name", "pattern"],                    // string | Item | function -> string | $markup
            resizable:true,
            numerated:false,
            selectable:true
            // pager:{type:types.primitives.Set},
            // isFolder:{type:types.primitives.Any},
            // getIcon:{type:types.primitives.Any},
            // getSubitems:{type:types.primitives.Any}
        });

        controller.init([".folder","=","$oid('/root/PROJECT')"]);

    }

});