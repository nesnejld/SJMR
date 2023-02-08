var context = {};
$(function () {
    let folderopen = 'fa fa-folder-open';
    let folderclosed = 'fa fa-folder';
    let contentdirectory = 'content/';
    let gettree = async function (hrefparent, depth) {
        // console.log(hrefparent)
        // console.log(depth)
        return new Promise(resolve => {
            let children = [];
            $.get(hrefparent).then(async function (d) {
                $.each($.parseHTML(d), async function (i, el) {
                    // console.log(el)
                    if (el.tagName == 'TABLE') {
                        let trs = $('tr', el);
                        $.each(trs, async function (i, tr) {
                            if ($('th', tr).length == 0 && $('img[alt="[PARENTDIR]"]', tr).length == 0) {
                                let directory = false;
                                $('td', tr).each(function (i, td) {
                                    if (i == 0) {
                                        if ($('img[alt="[DIR]"]', td).length == 1) {
                                            directory = true;
                                        }
                                        if ($('img[alt="[FILE]"]', td).length == 1) {
                                            //file
                                        }
                                    }
                                    else if (i == 1) {
                                        href = $('a', td).attr('href');
                                        text = $('a', td).text();
                                    }
                                });
                                children.push({ parent: hrefparent, self: href, name: hrefparent + href, directory: directory, depth: depth });
                            }
                        });
                    }
                });
                resolve(children);
            });
        });
    };
    async function callit(directory) {
        return new Promise(async function (resolve) {
            let allchildren = await gettree(directory, 0);
            children = allchildren;
            while (true) {
                if (!children || children.length == 0) {
                    break;
                }
                let nextchildren = [];
                for (c of children) {
                    if (c.directory) {
                        cc = await gettree(c.name, c.depth + 1);
                        c.children = cc;
                        // console.log(cc)
                        nextchildren = nextchildren.concat(cc);
                    }
                }
                allchildren = allchildren.concat(nextchildren);
                children = nextchildren.filter(c => c.directory);
            }
            resolve(allchildren);
        });
    }
    function getJSON(el) {
        let json = { self: el.self, uri: el.name };
        if (el.children) {
            json.children = [];
            for (let c of el.children) {
                json.children.push(getJSON(c));
            }
        }
        return json;
    }
    let listtype = "ul";
    function renderJSON(json) {
        let list = $(`<${listtype}>`);
        list.addClass("json hide");
        for (let j of json) {
            let li = $("<li>");
            if (j.children || j.self.toUpperCase().match('\.MP3$')
                || j.self.toUpperCase().match('\.M4A$')
                || j.self.toUpperCase().match('\.OGG$')) {
                let span = $("<span>");
                span.text(decodeURIComponent(j.self).replace(/\/$/, '').replace(/\..[A-z]*$/, ''));
                li.append(span);
                list.append(li);
                li.attr('data-uri', j.uri);
                li.attr('data-leaf', false);
                if (j.children) {
                    // li=$("<li>")
                    // list.append(li)
                    li.prepend($("<i>").addClass(folderclosed).attr("href", '#').css("margin-right", "20px"));
                    let a = $('<a href="#" class="fa fa-play-circle-o singleplay" style="text-decoration:none;"></a>');
                    li.prepend(a);
                    li.
                        append(renderJSON(j.children));
                    a.on("click", audio.playallchildren.bind(audio));
                }
                else {
                    let a = $('<a href="#" class="fa fa-play-circle-o singleplay" style="text-decoration:none;"></a>');
                    li.prepend(a);
                    a.on('click', function (event) {
                        // queue.push($(event.target).parent().attr('data-uri'));
                        // updateq();
                        // if (!playing) {
                        //     playall();
                        // }
                        audio.add(event);

                    });
                    li.attr('data-leaf', true);
                }
            }
        }
        return list;
    }
    async function process(directory) {
        let d = await callit(directory);
        let json = [];
        for (let el of d) {
            if (el.depth == 0) {
                json.push(getJSON(el));
            }
        }
        return [d, json];
        // $('#json-renderer').jsonViewer(json);
        let ol = renderJSON(json);
        ol.removeClass("hide");
        let selector = "div.music";
        $(selector).empty().append(ol);
        /*
        $.contextMenu({
            // define which elements trigger this menu
            selector: "div.music li[data-leaf='false']",
            // define the elements of the menu
            items: {
                playall: {
                    name: function (a) {
                        return "Play all"
                    }, callback: function (key, opt) {
                        $("li[data-leaf='true']", this).each((i, e) => {
                            queue.push($(e).attr('data-uri'))
                        }
                        )
                        updateq()
                        if (!playing) {
                            playall()
                        }
                    }
                },
            }
        });
        */
        /*
        $.contextMenu({
            // define which elements trigger this menu
            selector: "div.music li[data-leaf='true']",
            // define the elements of the menu
            items: {
                playall: {
                    name: function (a) {
                        return "Play"
                    }, callback: function (key, opt) {
                        queue.push(this.attr('data-uri'))
                        updateq()
                        if (!playing) {
                            playall()
                        }
                    }
                },
            }
        });
        */
        /*
         $.contextMenu({
             // define which elements trigger this menu
             selector: "ul.dropdown-menu.music li",
             // define the elements of the menu
             items: {
                 remove: {
                     name: "Remove from queue", callback: function (key, opt) {
                         remove({ target: this })
                         return;
                     }
                 },
                 up: {
                     name: "Move up", callback: function (key, opt) {
                         moveup({ target: this })
                         return;
                     }
                 },
                 down: {
                     name: "Move down", callback: function (key, opt) {
                         movedown({ target: this })
                         return;
                     }
                 },
 
             }
             // there's more, have a look at the demos and docs...
         });
         */
        $('li', $(selector)).on("click", function (event) {
            event.stopPropagation();
            let eparent = $(event.target).parent();
            if ($(">" + listtype, eparent).length > 0) {
                $(">" + listtype, eparent).each((i, e) => {
                    if ($(e).hasClass('hide')) {
                        $(e).removeClass('hide').addClass('show');
                        $(">i", eparent).removeClass(folderclosed).addClass(folderopen);
                    } else {
                        $(e).removeClass('show').addClass('hide');
                        $(">i", eparent).removeClass(folderopen).addClass(folderclosed);

                    }
                });
            }
            else {
                // queue.push($(event.target).attr('data-uri'))
                // updateq()
                // if (!playing) {
                //     playall()
                // }
            }
            return;
        });
        // console.log(d)
        let table = $("<table>").addClass("table"); //.addClass('table-striped');
        let tbody = $("<tbody>");
        table.append(tbody);
        for (let el of d) {
            if (!el.directory) {
                let tr = $("<tr>");
                tbody.append(tr);
                let td = $("<td>");
                tr.append(td);
                td.addClass("music");
                // let a = $("<a>")
                // td.append(a)
                // a.attr("href", el.name)
                a = td;
                a.text(decodeURIComponent(el.name));
                a.attr("data-url", el.name);
                // td.on("click", async function (e) {
                //     td.trigger('add', [{ url: $(e.target).attr("data-url") }])
                // })
                td.on('add', async (e, p) => {
                    queue.push(p.url);
                    updateq();
                    if (!playing) {
                        playall();
                    }
                    return;
                });
            }

        }
    }
    async function load() {
        let data = await process(contentdirectory);
        context.directory = data;
        return;
    }
    load();

    function isimage(c) {
        return c.self.toLowerCase().endsWith('.jpg') || c.self.toLowerCase().endsWith('.jpeg')
            || c.self.toLowerCase().endsWith('.png');
    }
    function listimages(directory) {
        let images = [];
        let save = false;
        if (!directory) {
            if (context.images) {
                return context.images;
            }
            directory = { children: context.directory[0] };
            save = true;
        }
        for (let c of directory.children) {
            if (c.directory) {
                images.concat(listimages(c));
            }
            else {
                if (isimage(c)) {
                    images.push(c.name);
                }
            }

        }
        if (save) {
            context.images = images;
            data = btoa(JSON.stringify(images));
            let pieces = [];
            for (let i = 0; i < data.length; i += 1000) {
                pieces.push(data.substring(i, Math.min(i + 1000, data.length)));
            }
            async function putdata() {
                u = context.uuid()
                for (let i = 0; i < pieces.length; ++i) {
                    let p = pieces[i];
                    data = await $.get('/SJMR/cgi-bin/actions.sh', { data: p, piece: i, command: 'store', directory:u });
                    console.log(data)
                }
                data = await($.get('/SJMR/cgi-bin/actions.sh', { command: 'save', n: pieces.length, directory: u }))
                console.log(data)
            }

            putdata();
            // $.ajax({
            //     type: "PUT",
            //     url: "/SJMR/images.json",
            //     data: images,
            //     success: function() {
            //         console.log("ok")
            //     },
            //     dataType: "json"
            //     });
        }
        return images;
    }
    context.listimages = listimages;
    function resize() {
        let height = $("body").height() - $(".navbartop").height() - $(".navbarbottom").height() - 50;
        $("div.container-main").css('max-height', height);
        $("div.container-main").css('height', height);
        $("div.musicqueue").css('max-height', height);
        $("div.music").css('max-height', height);
        $("div.musiccontainer").css('max-height', height);
    }
    resize();
    $(window).on('resize', resize);

    $("body").tooltip({ selector: '[data-bs-toggle=tooltip]' });
}
);