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
            }
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

        $container.css({"height": 500, "overflow": "auto"});


        const grid = new item.view.collections.Grid({
            $container,
            data:controller,
            columns:[".name",".pattern"],
            header:["name", "pattern"],
            resizable:true,
            numerated:true,
            multiselect:true,
            checkbox:true,
            pager:{},
            contextmenu: [
                { 
                    caption: "Copy", 
                    icon: "",
                    enable: () => true, 
                    handler: (selectedRows, grid) => {
                        console.log("Copy action triggered for rows:", selectedRows);
                        const data = selectedRows.map(row => row.get("data").get()).map(item => item[".name"]).join(", ");
                        console.log("Selected items:", data);
                    }
                },
                { 
                    caption: "Delete", 
                    icon: "",
                    enable: () => grid.getSelected().length > 0, 
                    handler: (selectedRows, grid) => {
                        console.log("Delete action triggered for rows:", selectedRows);
                        const names = selectedRows.map(row => row.get("data").get()[".name"]);
                        console.log("Deleting items:", names);
                        
                        if(confirm(`Are you sure you want to delete ${names.length} item(s)?`)) {
                            console.log("Delete confirmed");
                        }
                    }
                },
                { 
                    caption: "Edit", 
                    icon: "",
                    enable: () => grid.getSelected().length === 1, 
                    handler: (selectedRows, grid) => {
                        const row = selectedRows[0];
                        const data = row.get("data").get();
                        console.log("Edit action triggered for:", data[".name"]);
                    }
                },
                { 
                    caption: "Refresh", 
                    icon: "",
                    enable: () => true, 
                    handler: (selectedRows, grid) => {
                        console.log("Refresh action triggered");
                        grid.refresh();
                    }
                }
            ]
        });

        let $from = +new Date();
        let $to = +new Date() + 86400000;

        controller.init([".folder","=","$oid('/root/FP/PROJECT')"]);

        console.log("Grid test initialized with controller and context menu");

        // controller.init(["or",[
        //     ["dt_on","[]",[$from, $to]],
        //     ["dt_off","[]",[$from, $to]],
        //     ["dt_ack","[]",[$from, $to]]
        // ]]);


        // let kendo = {"logic": "or", "filters":[
        //     {"field": "dt_on", "operator": "[]", "value":[$from, $to]},
        //     {"field": "dt_off", "operator": "[]", "value":[$from, $to]},
        //     {"field": "dt_ack", "operator": "[]", "value":[$from, $to]}
        // ]}

    }
}
