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
                "prop1":{ type:item.types.primitives.String },
                "prop2":{type:item.types.primitives.Integer}
            },
            subscribe:true
        });

        
        // let header;
        //
        // // nested header
        // header = [
        //     {text: "MEN", children: [
        //         {text: "LIKE", children: [
        //             {text: "On"},
        //             {text: "High"}
        //         ]},
        //         {text: "HOT WOMEN", children: [
        //             {text:"heels"}, {text: "!"}
        //         ]},
        //     ]}
        // ];
        //
        // // header type 2
        // header = ["name", "pattern", "folder", "oid"];
        //
        // // header type 3
        // header = [
        //     {  view: item.view.controls.TextInput, options:{ value: "name"} },
        //     {  view: item.view.primitives.Html, options:{ html: "pattern"} },
        //     {  text: "Folder" },
        //     {  text: () => "OID" },
        // ];
        //
        // // nested header with different views
        // header = [
        //     { view: item.view.primitives.Label, options:{ text: "MEN"}, children: [
        //         {text: () => "LIKE", children: [
        //             {view: item.view.primitives.Label, options:{ text: "ON", css: { "color": "green" }}},
        //             {text: "High"}
        //         ]},
        //         {text: "HOT WOMEN", children: [
        //             { view: item.view.controls.TextInput, options:{ value: "heels"}}, {text: "!"}
        //         ]},
        //     ]}
        // ];


        const grid = new item.view.collections.Grid({
            $container,
            data:controller,
            columns:["prop1","prop2"],    // string | { fields, handler } | Item }
            //header:["name", "pattern"],                    // string | Item | function -> string | $markup
            header:["prop1", "prop2"],
            resizable:true,
            numerated:true,
            multiselect:true,
            checkbox:true,
            pager:{}
            // isFolder:{type:types.primitives.Any},
            // getIcon:{type:types.primitives.Any},
            // getSubitems:{type:types.primitives.Any}
        });

        controller.init([".pattern","=","$oid('/root/FP/primitives/prim1')"]);

    }
}
