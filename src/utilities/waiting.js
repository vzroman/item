
export function waiting( $container ){
    const $body = $('body');
    const $element = $container ?? $body;
    const $lock=$('<div class="overlay"><div class="wait-img"></div></div>').appendTo($body);
    const onResize = ()=>{
        const {top, left} = $container.offset();
        const width = $container.outerWidth();
        const height = $container.outerHeight();
        $lock.css({top, left, width:`${width}px`, height:`${height}px`});
    }
    const resizeObserver = new ResizeObserver(() => {
        onResize()
    });
    resizeObserver.observe($element["0"]);

    return function () {
        resizeObserver.disconnect();
        $lock.remove();
    }
}