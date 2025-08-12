import {item} from "../index.js"
import icon from "./notify.svg"
import styles from "./notify.css"

export function notify(text, timeout) {
    return new Promise(resolve => {
        let dialog = new item.view.layout.Window({
            icon: `url("${icon}")`,
            actions: ["close"],
            view: {
                view: item.view.primitives.Label,
                options: { text, classes: [styles.notify] }
            },
            events: {
                destroy: () => {
                    clearTimeout(timer);
                    resolve();
                }
            }
        });

        let timer;
        if (timeout && typeof timeout === 'number') {
            timer = setTimeout(() => {
                dialog.destroy();
            }, timeout);
        }
    });
}
