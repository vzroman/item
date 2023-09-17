import {item} from "../index.js"
import icon from "./error.svg"

export function error( error ){
    return new Promise(resolve =>{
        new item.view.layout.Window({
            title:item.i18n.text("ERROR")+"!",
            icon:`url("${ icon }")`,
            actions:["close"],
            view:{
                view:item.view.primitives.Label,
                options:{ text:error, css:{ padding:"10px" }}
            },
            events:{ destroy:resolve }
        });
    })
}