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
            orderBy:"type_ss",
            data:[
                {
                    name:"Almaty",
                    type_ss:"220",
                    region:"South"
                },
                {
                    name:"Pavlodar",
                    type_ss:"300",
                    region:"North"
                },
                {
                    name:"Atyrau",
                    type_ss:"1150",
                    region:"West"
                },
                {
                    name:"Aktau",
                    type_ss:"6",
                    region:"West"
                },
                {
                    name:"Aktobe",
                    type_ss:"220",
                    region:"West"
                },
                {
                    name:"Shymkent",
                    type_ss:"500",
                    region:"South"
                },
                {
                    name:"Semei",
                    type_ss:"6",
                    region:"North"
                },  {
                    name:"Karaganda",
                    type_ss:"6",
                    region:"West"
                },
                {
                    name:"Oral",
                    type_ss:"220",
                    region:"West"
                },
                {
                    name:"Kostanai",
                    type_ss:"500",
                    region:"South"
                },
                {
                    name:"Zhambul",
                    type_ss:"6",
                    region:"North"
                }
            ]
        });

        
        const grid = new item.view.collections.Grid({
            $container,
            data:controller,
            columns:["name","type_ss", "region"],   
            header:["name", "type_ss", "region"],
            resizable:true,
            numerated:true,
            multiselect:true,
            checkbox:true,
            pager:{}
        });

        setTimeout(()=>{
            controller.option("keyCompare", DEFAULT_COMPARE)
        }, 15000)

        setTimeout(()=>{
            controller.option("keyCompare", REVERSE_COMPARE)
        }, 10000)

        setTimeout(()=>{
            controller.option("keyCompare", DEFAULT_COMPARE)
        }, 5000)
        

    }

    //Compare for number typeof data
    function REVERSE_COMPARE(a, b) {
        if (a[0] < b[0]) return 1;
        if (a[0] > b[0]) return -1;
        // Если a[0] == b[0], то сравниваем по a[1] и b[1] в обратном порядке
        return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0;
    }
    
    //Compare for number typeof data
    function DEFAULT_COMPARE(a, b) {
        if (a[0] > b[0]) return 1;
        if (a[0] < b[0]) return -1;
        // Если a[0] == b[0], то сравниваем по a[1] и b[1]
        return a[1] > b[1] ? 1 : a[1] < b[1] ? -1 : 0;
    }


    // console.log(DEFAULT_COMPARE([6,"1"], [1150,"9"]))
}
