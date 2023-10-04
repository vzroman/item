import {item} from "../index.js"
import icon from "./error.svg"
import styles from "./error.css"

export function error( error ){
    return new Promise(resolve =>{
        new item.view.layout.Window({
            title:item.i18n.text("ERROR")+"!",
            icon:`url("${ icon }")`,
            actions:["close"],
            classes:[styles.error_window],
            view:{
                view:item.view.primitives.Html,
                options:{ html:error, classes:[styles.error]}
            },
            events:{ destroy:resolve }
        });
    })
}