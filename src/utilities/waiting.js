import styles from "./lock/lock.css";
import lock from "./lock/lock.gif";

export function waiting( $container ){
    const $body = $('body');
    const $element = $container ?? $body;
    const z_index = $element.css("zIndex") + 100;
    const $lock=$(`
        <div 
            class="${styles.overlay}" 
            style="
                background-image: url(${lock}); 
                z-index: ${z_index}
            "
        ></div>`).appendTo($body);

    const resize = ()=>{
        if (!document.contains($element[0])){
            return clear();
        }
        const {top, left} = $element.offset();
        const width = $element.outerWidth();
        const height = $element.outerHeight();
        $lock.css({top, left, width:`${width}px`, height:`${height}px`});
    }
    const timer = setInterval(resize, 50);
    const clear = () => {
        clearInterval(timer);
        $lock.remove();
    }

    return clear;
}
