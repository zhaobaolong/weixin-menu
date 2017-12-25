(function(){
    var config = {
        get: {
            url: "getMenu",
            method: "get",
        },
        save: {
            url: "saveMenu",
            method: "post",
        },
        query: {
            url: "queryMenu",
            method: "get",
        },
        publish: {
            url: "createMenu",
            method: "get",
        }
    };
    var app = angular.module('weixin_menu', []);

    function getLength(str) {
        return str.replace(/[^\x00-\xff]/g,"aa").length;
    };

    // 菜单编辑
    app.controller('menu', function($scope, $http) {
        $scope.back = {};
        $scope.checked = [];
        $scope.editting = {};
        $scope.has_error = false;
        $scope.lists = [];
        $scope.menuCnt = 1;
        $scope.menus = [];
        $scope.menuShow = [];
        $scope.modalError = false;
        $scope.sortable = false;
        $scope.typeArray = {
            click: "菜单Key",
            view: "跳转网页",
            scancode_push: "扫描事件",
            scancode_waitmsg: "扫描弹框",
            pic_sysphoto: "拍照发图",
            pic_photo_or_album: "拍照相册",
            pic_weixin: "相册发图",
            location_select: "地理选择"
        };
        
        // 更新列表的 cnt 和 position
        function update(lists) {
            var position = 0;
            for (var i = 0; i < lists.length; i++) {
                lists[i].cnt = i;
                if (i != 0 && lists[i].rank == 1) {
                    position++;
                }
                lists[i].position = position;
            };
        }

        //加载菜单
        function load(res) {

            var lists = [], cnt = 0, menus = [];

            menus = res['menu'] ? res['menu']['button'] : res['button'];

            // 一级菜单个数初始化
            $scope.menuCnt = menus.length;

            // 将数组的层数将为一层
            for (var i = 0; i < menus.length; i++) {
                var menu = menus[i];

                // 一级菜单
                lists[cnt] = {
                    rank: 1
                }
                for (var key in menu) {
                    if (key != "sub_button") {
                        lists[cnt][key] = menu[key];
                    }
                }
                lists[cnt].cnt = cnt;
                lists[cnt].position = i;
                cnt++;

                // 二级菜单
                if (menu["sub_button"]) {
                    for (var j = 0; j < menu['sub_button'].length; j++) {
                        lists[cnt] = menu['sub_button'][j];
                        lists[cnt]['rank'] = 2;
                        lists[cnt]['cnt'] = cnt;
                        lists[cnt]['position'] = i;
                        cnt++;
                    };
                }
                lists[cnt] = {
                    name: "添加二级菜单",
                    rank: 3,
                    cnt: cnt
                };
                cnt++;
            };
            // 再次处理特殊情况
            for (var i = 0; i < lists.length; i++) {
                if (lists[i].url) {
                    lists[i].key = lists[i].url;
                }
            };
            //console.log($scope.menu);
            $scope.lists = lists;
            setTimeout(function () {
                $(".dd-list").sortable().disableSelection();
            }, 500);
        }


        $scope.query = function () {
            $http({
                url: config.query.url,
                method: config.query.method
            }).success(function (res) {
                load(res);
            }).error(function () {
                alert("查询失败");
            });
        };


        $scope.publish = function() {
            $http({
                url: config.publish.url,
                method: config.publish.method
            }).success(function(res){
                alert(res);
            }).error(function(){
                alert("保存失败");
            });
        };

        // 保存
        $scope.save = function () {
            var button = {button:null};
            var menu = [], cnt = -1, item, num;
            for (var i = 0; i < $scope.lists.length; i++) {
                if ($scope.lists[i].unselect == true) {
                    alert("存在还未设置响应动作的菜单，请检查");
                    return false;
                }
            }
            for (var i = 0; i < $scope.lists.length; i++) {
                item = $scope.lists[i];
                if (item.rank == 3) {
                    continue;
                }
                if (item.rank == 1) {
                    num = 0;
                    menu[++cnt] = copyItem(item);
                } else {
                    menu[cnt].sub_button[num++] = copyItem(item);
                }
            };
            button.button = menu;
            console.log(JSON.stringify(button));
            $http({
                url: config.save.url,
                method: config.save.method,
                data: {button: JSON.stringify(button)}
            }).success(function(res){
                alert(res);
            }).error(function(){
                alert("保存失败");
            });
        };

        // 取消排序
        $scope.cancelSort = function() {
            $(".dd-list").sortable('cancel');
            $scope.sortable = false;
        };

        // 排序
        $scope.sort = function() {
            var que = [], num = 0, lists = [], id;
            var obj = $(".dd-handle");
            for (var i = 0; i < obj.length; i++) {
                id = $(obj[i]).attr("data-id");
                if (i != 0 && $scope.lists[id].rank == 1) {
                    lists[num++] = {
                        name: "添加二级菜单",
                        rank: 3
                    }
                }
                lists[num++] = $scope.lists[id];
            };
            lists[num] = {
                name: "添加二级菜单",
                rank: 3
            }

            // 更新列表的 cnt 和 position
            update(lists);

            $scope.lists = lists;
            $scope.sortable = false;
        };

        // 转换
        function copyItem(item) {
            var res = {
                name: item.name
            };
            if (item.rank == 1) {
                res.sub_button = [];
            }
            if (item.type) {
                res.type = item.type;
                if (item.type == "view") {
                    res.url = item.key;
                } else {
                    res.key = item.key;
                }
            }
            return res;
        }

        // 点击菜单
        $scope.menuClick = function(num) {
            var open = $scope.menuShow[num];
            $scope.menuShow = [];
            $scope.menuShow[num] = !open;
        };

        // 新增菜单
        $scope.add = function() {
            var cnt = 0;
            var len = $scope.lists.length;
            for (var i = 0; i < len; i++) {
                if ($scope.lists[i].rank == 1) {
                    cnt++;
                }
            };
            if (cnt >= 3) {
                alert("一级菜单最多创建3个");
            } else {
                $scope.menuCnt++;
                $scope.lists.push(
                    {
                        name: "",
                        rank: 1,
                        unselect: true,
                        cnt: len,
                        position: $scope.menuCnt
                    },
                    {
                        name: "添加二级菜单",
                        rank: 3,
                        cnt: len + 1
                    }
                );
                $scope.edit(len);
            }
        }

        // 模态框完成
        $scope.modalFinish = function() {
            var key = $scope.editting.key;
            var num = $scope.editting.num;
            var type = $scope.editting.type;

            if (!key) {
                $scope.modalError = true;
                return false;
            }

            $scope.lists[num].unselect = false;
            $scope.lists[num].type = type;
            $scope.lists[num].key = key;
            $('#myModal').modal('hide');
        };

        // 模态框取消
        $scope.modalCancel = function() {
            var key = $scope.back.modal;
            if (key) {
                $scope.editting.key = key;
            }
            $scope.modalFinish();
        };

        $scope.modalKeyup = function(e){
            $scope.modalError = false;
            var keycode = window.event ? e.keyCode : e.which;
            if(keycode == 13) {
                $('#myModalInput').blur();
                $scope.modalFinish();
            }
        };
        // 打开模态框
        $scope.select = function(num, type) {
            //console.log(type);
            var key = $scope.lists[num].key;
            $scope.back.modal = key;
            $scope.editting = {
                num: num,
                type: type,
                key: key,
                title: type=="view" ? '设置菜单跳转链接' : '设置菜单KEY值',
                note: type=="view" ? "点击该菜单会跳到以上链接" : "菜单KEY值，用于消息接口推送，不超过64个字"
            };
            $("#myModal").modal({
                backdrop: 'static',
                keyboard: false
            });
            $('#myModalInput').focus();
        };

        // 删除列表
        $scope.del = function(num) {
            var lists = [], cnt = 0, flag = false;
            var rank = $scope.lists[num].rank;

            // 判断是否为二级菜单的最后一个
            if(rank == 2 && $scope.lists[num-1].rank == 1) {
                if (!$scope.lists[num+2] || $scope.lists[num+2].rank == 1) {
                    $scope.lists[num-1].unselect = true;
                    $scope.lists[num-1].key = '';
                }
            }

            // 进行删除
            for (var i = 0; i < $scope.lists.length; i++) {
                if (i != num) {
                    if (rank==1 && flag && $scope.lists[i]['rank']!=1) {
                        continue;
                    }
                    lists[cnt++] = $scope.lists[i];
                    flag = false;
                } else {
                    flag = true;
                }
            };
            
            // 更新列表的 cnt 和 position
            update(lists);

            // 更新一级菜单数量
            if(rank == 1) {
                $scope.menuCnt--;
            }

            $scope.menuShow = [];
            //console.log(lists);
            $scope.lists = lists;
        };

        // 输入框失去焦点
        $scope.myBlur = function(num) {
            var name = $scope.lists[num].name.trim();
            var rank = $scope.lists[num].rank;
            $scope.has_error = false;
            $scope.checked[num] = false;
            if (name === "") {
                $scope.lists[num].name = $scope.back[num].name;
                $scope.lists[num].rank = $scope.back[num].rank;
                return false;
            }
            while(getLength(name) > rank * 8) {
                $scope.lists[num].name = name.substr(0, name.length-1);
                name = $scope.lists[num].name;
            }
            if ($scope.back[num].rank == 3) {
                $scope.lists[num].unselect = true;
                $scope.lists[num].position = $scope.lists[num-1].position;
                // 新增添加二级菜单一栏
                var lists = [], cnt = 0;
                for (var i = 0; i < $scope.lists.length; i++) {
                    lists[cnt] = $scope.lists[i];
                    cnt++;
                    if (num == i) {
                        lists[cnt] = {
                            name: "添加二级菜单",
                            rank: 3
                        };
                        cnt++;
                    }
                };
                // 更新列表的 cnt 和 position
                update(lists);
                $scope.lists = lists;
            }
            $scope.back[num] = {};
        }

        // 编辑输入框
        $scope.edit = function(num) {
            $scope.back[num] = {};
            $scope.back[num].name = $scope.lists[num].name;
            $scope.back[num].rank = $scope.lists[num].rank;
            var rank = $scope.lists[num].rank;
            if (rank == 3) {
                if($scope.lists[num-1].rank == 1) {
                    if (!confirm("确认使用二级菜单？\n使用二级菜单后，当前编辑的消息将会被清除。")) {
                        return false;
                    }
                    $scope.lists[num-1].unselect = false;
                    $scope.lists[num-1].type = '';
                    $scope.lists[num-1].key = '';
                } else {
                    var tmp = num, cnt = 0;
                    while(tmp >=0 && $scope.lists[tmp-1].rank != 1) {
                        cnt++;
                        tmp--;
                    }
                    if (cnt == 5) {
                        alert("每个一级菜单下最多只能有5个二级菜单");
                        return false;
                    }
                }
                $scope.lists[num].rank = 2;
                $scope.lists[num].name = '';
            }
            $scope.checked[num] = true;
            setTimeout(function(){$(".input-" + num).focus();}, 50);
        };

        // 输入过程
        $scope.myKeyup = function(e, num){
            var name = $scope.lists[num].name.trim();
            var rank = $scope.lists[num].rank;
            if (getLength(name) > 8 * rank) {
                $scope.has_error = true;
            } else {
                $scope.has_error = false;
            }
            var keycode = window.event ? e.keyCode : e.which;
            if(keycode == 13) {
                $scope.myBlur(num);
            }
        };

        // 生成列表
        $http({
            url: config.get.url,
            method: config.get.method
        }).success(function(res) {
            load(res);
        });
    });

    $(".container").show();
})();