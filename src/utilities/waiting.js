
export function waiting( $container ){
    const $body = $('body');
    const $lock=$('<div class="overlay"><div class="wait-img"></div></div>').appendTo($body);
    let top, left, width, height;
    if ($container){
        const offset = $container.offset();
        top = offset.top;
        left = offset.left;
        width = $container.outerWidth();
        height = $container.outerHeight();
    }else{
        top = 0;
        left = 0;
        width = $container.outerWidth();
        height = $container.outerHeight();
    }

    $lock.css({top, left, width:`${width}px`, height:`${height}px`});

    return function () { $lock.remove(); }
}