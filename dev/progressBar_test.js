
import {item} from "../dist/item.js";

export function run( $container ){

    const body =  $(`<div style="width: 100%;height: 500px; background-color: white; border:2px solid red; padding:8px 4px">
            <div name="progress_bar" style="padding:30px; border:2px solid black"></div>
            <div name="numberInput" style="padding:30px"></div>
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
}