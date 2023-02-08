$(function () {
    // alert('init.js loaded');
    menubar = $(`<nav class="nav d-flex justify-content-between">
<a class="p-2 link-secondary home" href="#">Home</a>
<a class="p-2 link-secondary calendar" href="#">Calendar</a>
<a class="p-2 link-secondary raves" href="#">Races</a>
<a class="p-2 link-secondary gallery" href="#">Photo Gallery</a>
<a class="p-2 link-secondary" href="#">Membership</a>
<a class="p-2 link-secondary" href="#">Local Contributors</a>
<a class="p-2 link-secondary" href="#">Contacts</a>
<a class="p-2 link-secondary" href="#">About</a>
</nav>`);
    $('div.nav-scroller.py-1.mb-2').empty();
    $('div.nav-scroller.py-1.mb-2').append(menubar);
    $('div.nav-scroller.py-1.mb-2 a.home').on('click', event => {
        $('main.blog').show();
        $('main.gallery').hide();
    });
    $('div.nav-scroller.py-1.mb-2 a.gallery').on('click', event => {
        $('main.blog').hide();
        let images = context.listimages();
        let main = $('main.gallery');
        if (false) {
            let table = $("<table>");
            let tbody = $("<tbody>");
            main.append(table.append(tbody));
            let i = 0;
            for (let image of images) {
                let tr = $("<tr>");
                let td = $("<td>");
                let img = $("<img>");
                tbody.append(tr.append(td.append(img)));
                img.attr("src", image);
                i += 1;
                // if(i>3) {
                //     break
                // }
            }
        }
        else {
            main.empty();
            if (true) {
                let divrow = $("<div>").addClass("row");
                for (let image of images) {
                    let div = $("<div>").addClass("col-sm-6 col-md-4 col-lg-3 item");
                    let a = $("<a>").attr("href", image).attr({ "data-lightbox": "photos", "data-title": image });
                    let img = $("<img>").addClass("img-fluid").attr("src", image).css("width", "150px");
                    divrow.append(div.append(a.append(img)));
                }
                main.append(divrow);
            }
            else {

                for (let image of images) {
                    let a = $("<a>").attr("href", image).attr("data-lightbox", "photos");
                    let img = $("<img>").attr("src", image).css("width", "100px");
                    main.append(a.append(img));
                }
            }
        }
        $('main.gallery').show();
    });
}
);