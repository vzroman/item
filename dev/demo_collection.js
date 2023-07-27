
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
        const data = new item.controllers.db.Collection({
            connection:()=>connection,
            schema:{
                ".name":{ type:item.types.primitives.String, default:"o4" },
                ".folder":{ type:item.types.primitives.String, default:"/root" },
                ".pattern":{ type:item.types.primitives.String, default:"/root/.patterns/test" },
                prop1:{ type:item.types.primitives.String },
                prop2:{ type:item.types.primitives.Integer },
                prop3:{ type:item.types.primitives.Any },
                prop4:{ type:item.types.primitives.Any }
            },
            data:["and",[
                [".pattern",'=',"$oid('/root/.patterns/test')"]
            ]]
        });


        const widget = new MyWidget({
            $container,
            data,
            itemRelations:{
                isSource:true,
                isConsumer:false
            }
        });

        debugger

        //data.set({prop1:"green"})

    }




}


class MyWidget extends item.view.Collection{

    // static options = {
    //     color:{ type: item.types.primitives.String, default:"red" }
    // }

    static markup = `<table style="width: 100%; height: 100%">
    </table>`;

    // static widgets = {
    //     // text:{
    //     //     view:item.view.controls.TextInput,
    //     //     options:{
    //     //         links:{ value:"prop1" },
    //     //         events:{ value:"prop1" }
    //     //     }
    //     // },
    //     // number:{
    //     //     view:item.view.controls.NumberInput,
    //     //     options:{
    //     //         links:{ value:"prop2" },
    //     //         events:{ value:"prop2" }
    //     //     }
    //     // }
    // };
    newItem(id, prev){
        return new ItemWidget({
            $container:this.$markup
        })
    }


}
MyWidget.extend();

class ItemWidget extends item.view.Item{

    static options = {
        color:{ type: item.types.primitives.String, default:"red" }
    }

    static markup = `<tr style="width: 100%; height: 100%">
        <td name="text"></td>
        <td name="number"></td>
    </tr>`;

    static widgets = {
        text:{
            view:item.view.controls.TextInput,
            options:{
                links:{ value:"prop1" },
                events:{ value:"prop1" }
            }
        },
        number:{
            view:item.view.controls.NumberInput,
            options:{
                links:{ value:"prop2" },
                events:{ value:"prop2" }
            }
        }
    };

    constructor(options) {
        super( options );

        // this.bind("color", color => {
        //     this.$markup.css({"background-color":color})
        // } );
    }

}
ItemWidget.extend();