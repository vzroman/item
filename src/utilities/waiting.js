
export function waiting( $container ){
    $container = $container ?? $('body');
    const $lock=$('<div class="overlay"><div class="wait-img"></div></div>').appendTo($container);
    return function () { $lock.remove(); }
}