import {item} from "../index.js"
import icon from "./notify.svg"
import styles from "./notify.css"

export function notify( text ){
    return new Promise(resolve =>{
        new item.view.layout.Window({
            icon:`url("${ icon }")`,
            actions:["close"],
            view:{
                view:item.view.primitives.Label,
                options:{ text, classes:[styles.notify]}
            },
            events:{ destroy:resolve }
        });
    })
}