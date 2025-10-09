
import {item} from "../dist/item.js";

export function run( $container ){

    const body =  $(`<div style="width: 100%;height: 500px; background-color: white; border:2px solid red; padding:8px 4px">
            <div name="progress_bar" style="padding:30px; border:2px solid black"></div>
            <div name="numberInput" style="padding:30px"></div>
            <div name="button" style="padding:30px"></div>
        </div>`);

    body.appendTo($container);
    const a = new item.view.controls.ProgressBar({
        $container:body.find('[name="progress_bar"]'),
        validate:{
            min:0,
            max:200
        },
        value:60
    })

    const b = new item.view.controls.NumberInput({
        $container:body.find('[name="numberInput"]'),
        validate:{
            min:0,
            max:300
        },
        value:65.6,
        events:{
            value:(value) => a.set({value})
        }
    })

    class View extends item.view.Item{

        static options = {
            value:{type:item.types.primitives.Float, default:90}
        }

        markup(){
            const body =  $(`<div style="width: 100%;height: 500px; background-color: white; border:2px solid red; padding:8px 4px">
            <div name="progress_bar" style="padding:30px; border:2px solid black"></div>
            <div name="numberInput" style="padding:30px"></div>
        </div>`);
        return body
        }

        widgets(){
            return {
                progress_bar:{
                    view:item.view.controls.ProgressBar,
                    options:{
                        validate:{
                            min:0,
                            max:200
                        },
                        links:{value:"data@value"},
                        events:{value:"data@value"}
                    }
                },
                numberInput:{
                    view:item.view.controls.NumberInput,
                    options:{
                        validate:{
                            min:0,
                            max:300
                        },
                        links:{value:"data@value"},
                        events:{value:"data@value"}
                    }
                }
            }
        }
    }
    View.extend();

    const c = new item.view.controls.Button({
        $container:body.find('[name="button"]'),
        text:"Test z-index",
        events:{
            click:()=>{
                const data = new item.controllers.Item({
                    schema:{
                        value:{type:item.types.primitives.Float}
                    },
                    data:{value:60}
                })

                new item.view.layout.Window({
                    data,
                    view:{
                        view:View,
                        options:{
                            data
                        }
                    },
                    title:"Чекаем z-index",
                    width:500,
                    height:500,
                    events:{
                        destroy:()=>data?.destroy()
                    }
                })
            }
        }
    })
}