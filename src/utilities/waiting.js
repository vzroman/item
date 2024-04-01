import styles from "./lock/lock.css";
import lock from "./lock/lock.gif";

export function waiting( $container ){
    const $body = $('body');
    const $element = $container ?? $body;
    const $lock=$(`<div class="${styles.overlay}" style="background-image: url(${lock})"></div>`).appendTo($body);

    //const $lock=$(`<div class="${styles.overlay}"><div class="${styles.wait_img}" style="background-image: url(${lock})"></div></div>`).appendTo($body);
    const onResize = ()=>{
        const {top, left} = $element.offset();
        const width = $element.outerWidth();
        const height = $element.outerHeight();
        $lock.css({top, left, width:`${width}px`, height:`${height}px`});
    }
    const resizeObserver = new ResizeObserver(() => {
        onResize()
    });
    resizeObserver.observe($element["0"]);

    document.addEventListener('scroll', onResize, true);

    return function () {
        document.removeEventListener('scroll', onResize, true);
        resizeObserver.disconnect();
        $lock.remove();
    }
}