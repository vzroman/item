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

        const controller = new item.controllers.Collection({
            schema:{
                "name":{ type:item.types.primitives.String },
                "type_ss":{type:item.types.primitives.Integer},
                "region":{type:item.types.primitives.String},
            },
            orderBy:"name",
            data:[
                {
                    name:"Almaty",
                    type_ss:220,
                    region:"South"
                },
                {
                    name:"Pavlodar",
                    type_ss:110,
                    region:"North"
                },
                {
                    name:"Atyrau",
                    type_ss:220,
                    region:"West"
                },
                {
                    name:"Aktau",
                    type_ss:500,
                    region:"West"
                },
                {
                    name:"Aktobe",
                    type_ss:220,
                    region:"West"
                },
                {
                    name:"Shymkent",
                    type_ss:500,
                    region:"South"
                },
                {
                    name:"Astana",
                    type_ss:6,
                    region:"North"
                }
            ]
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
            columns:["name","type_ss", "region"],    // string | { fields, handler } | Item }                  // string | Item | function -> string | $markup
            header:["name", "type_ss", "region"],
            resizable:true,
            numerated:true,
            multiselect:true,
            checkbox:true,
            pager:{}
            // isFolder:{type:types.primitives.Any},
            // getIcon:{type:types.primitives.Any},
            // getSubitems:{type:types.primitives.Any}
        });


        setTimeout(()=>{
            controller.option("orderBy", "region")
        }, 3000)

        setTimeout(()=>{
            controller.option("keyCompare", REVERSE_COMPARE)
        }, 6000)

        const controller2 = new item.controllers.Collection({
            schema:{
                "name":{ type:item.types.primitives.String },
                "type_ss":{type:item.types.primitives.Integer},
                "region":{type:item.types.primitives.String},
            },
            orderBy:"region",
            data:[
                {
                    name:"Almaty",
                    type_ss:220,
                    region:"South"
                },
                {
                    name:"Pavlodar",
                    type_ss:110,
                    region:"North"
                },
                {
                    name:"Atyrau",
                    type_ss:220,
                    region:"West"
                },
                {
                    name:"Aktau",
                    type_ss:500,
                    region:"West"
                },
                {
                    name:"Aktobe",
                    type_ss:220,
                    region:"West"
                },
                {
                    name:"Shymkent",
                    type_ss:500,
                    region:"South"
                },
                {
                    name:"Astana",
                    type_ss:6,
                    region:"North"
                }
            ]
        });
        // console.log(grid.get("data"))
        // setTimeout(() =>{
        //     controller._destroy();
        //     console.log("event прошёл")
        //     grid.set({data:controller2})
        //     console.log(grid.get("data"));
        // }, 3000)
    }

    function REVERSE_COMPARE(a,b) {
        return a < b ? 1 : a > b ? -1 : 0; 
    }
    
    function DEFAULT_COMPARE (a, b) { 
        return a > b ? 1 : a < b ? -1 : 0; 
    }
}
