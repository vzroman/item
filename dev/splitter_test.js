import {Ecomet} from "./ecomet.js";
import {item} from "../dist/item.js";

export function run( $container ){

    const connection = new Ecomet();

    function connect(){
        console.debug("connecting...");
        connection.connect("127.0.0.1", 8000, "http:", ()=>{
            console.debug("connected, logging in...");
            connection.login("system", "111111", ()=>{

                console.debug("logged as system");

                doTest();

            },console.error);
        }, err=>{
            console.error( "connect error", err );
            setTimeout(connect, 1000);
        }, ()=>{
            console.error( "connection closes" );
            setTimeout(connect, 1000);
        });
    }

    connect();


    function doTest(){


        const $markup = $(`<div style="height: 500px; width: 1300px; border: 1px solid black">
            <div style="max-width: 500px">
                <img src="https://th.bing.com/th/id/R.77c9cea07f42aab16acd14b29439db4f?rik=E%2bbDbAVv7Bxk%2fg&pid=ImgRaw&r=0" />
            </div>
            <div style="height:120px">
                <p>Lorem isadasdadasdasda asdasd  adasda a dssd ssd ada</p>
                <div name="dynamic" style="background-color:red; height:100px; width:100px;"></div>
            </div>
            <div style="width: 100%; height: 100%">
                <div name="s2" style="width:inherit; height: inherit">
                    <div> <p>Lorem isadasdadasdasda asdasd  adasda a dssd ssd ada</p></div>
                    <div name="s2-1" style="width: 100%; height: 100%"> 
                        <div style="max-width: 300px"><img src="https://w0.peakpx.com/wallpaper/639/317/HD-wallpaper-anime-anime-girls-digital-art-artwork-portrait-display-vertical-2d-morikura-en-brunette-brown-eyes-school-uniform.jpg" /></div>
                        <p>Lorem isadasdadasdasda asdasd  adasda a dssd ssd ada</p>
                    </div>
                </div>
            </div>
        </div>`).appendTo($container);

        const s = new item.view.layout.Splitter({
            $container: $markup,
            orientation: "horizontal",
        });

        const s2 = new item.view.layout.Splitter({
            $container: $markup.find('[name="s2"]'),
            orientation: "vertical"
        });

        const s21 = new item.view.layout.Splitter({
            $container: $markup.find('[name="s2-1"]'),
            orientation: "horizontal"
        });

        

        setTimeout(()=>{
            $markup.find('[name="dynamic"]').width(700)
        }, 5000);


    }
}
