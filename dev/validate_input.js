
import {item} from "../dist/item.js";

export function run( $container ){

    const a = new item.view.controls.TextInput({
        $container,
        validate:"^[a-zA-Z0-9]+$",
        events:{
            value:(val)=>{
                console.log(val);
            }
        }
    })
}