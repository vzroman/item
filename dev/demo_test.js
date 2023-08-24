
import {item} from "../dist/item.js";
import {Ecomet} from "./ecomet.js";

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
        // const data = new item.controllers.db.Item({
        //     connection:()=>connection,
        //     autoCommit:true,
        //     schema:{
        //         prop1:{ type:item.types.primitives.String },
        //         prop2:{ type:item.types.primitives.Integer }
        //     },
        //     data:"/root/o1"
        // });
        const tabs = [
            {
                text: "Tab 1",
                view: MyWidget,
                options: {
                    color:"white"
                }
            }
        ]

        const widget = new item.view.layout.TabStrip({
            $container,
            tabs,
            events: {
                onChange: v => console.log("bindedd", v)
            },
            horizontal: true
        });


        // data.set({prop1:"green"})

    }




}


class MyWidget extends item.view.Item{

    static options = {
        color:{ type: item.types.primitives.String, default:"red" }
    }

    static markup = `<div style="width: 100%; height: 100%">
        <div name="text"></div>
    </div>`;

    static widgets = {
        text:{
            view:item.view.controls.Toggle,
            options:{
                // links:{ value:"prop1" },
                // events:{ value:"prop1" },
                value:true,
                textOn: "LONGT TEXT",
                textOff:"NOT LONG TEXT"
            }
        }
    };

    constructor(options) {
        super( options );

        this.bind("color", color => {
            this.$markup.css({"background-color":color})
        } );
    }

}
MyWidget.extend();