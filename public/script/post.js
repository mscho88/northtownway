function like(){
    $.ajax({
        url: "/post_like",
        type: "POST",
        data: {like: 'yes', url: window.location.pathname},
        success: function(response) {
             // console.log(returned); // here can get the return of route
        },
        error: function(error) {
            if(error.responseText == 'AlreadyLiked'){
                alert("You already liked this post.");
            }
        }
    });
    location.reload();
}
function addComment(id, dimension) {
    var commentEditor = '<li style="list-style-type:none;margin-left:' + dimension + '%;"><table><tr id="commentEditor">'+
                            '<td>'+
                                '<span class="form-inline" role="form">'+
                                    '<p>'+
                                        '<div class="form-group">'+
                                            '<input type="text" id="commentChildName" name="commentChildName" class="form-control col-lg-2" data-rule-required="true" placeholder="이름" maxlength="10">'+
                                            '<input type="password" id="commentChildPassword" name="commentChildPassword" class="form-control col-lg-2" data-rule-required="true" placeholder="패스워드" maxlength="10">'+
                                        '</div>'+
                                    '</p>'+
                                    '<textarea id="commentChildText" name="commentChildText" class="form-control" style="width:98%" rows="4"></textarea>'+
                                    '<div class="form-group">'+
                                        '<button type="button" onclick="commitComment('+ id +',' + parseInt(dimension + 1) +
                                            ')" id="commentChildSubmit" class="btn btn-default">확인</button>'+
                                    '</div>'+
                                '</span>'+
                            '</td>'+
                        '</tr></table></li>';
    $("#commentEditor").remove();
    $(commentEditor).insertAfter("#" + id);
}
function commitComment(id, dimension){
    var pName = $("#commentChildName");
    var pPassword = $("#commentChildPassword");
    var pText = $("#commentChildText");
       
    if($.trim(pName.val()) == ""){
        alert("이름을 입력하세요.");
        pName.focus();
        return;
    }else if($.trim(pPassword.val()) == ""){
        alert("패스워드를 입력하세요.");
        pPassword.focus();
        return;
    }else if($.trim(pText.val()) == ""){
        alert("내용을 입력하세요.");
        pText.focus();
        return;
    }
    $.ajax({
        url: "/replyofreply",
        type: "POST",
        data: {reply_id: id, dimension: dimension, name: pName.val(), password: pPassword.val(), contents: pText.val(), url: window.location.pathname},
        success: function (response) {
        },
        error: function (erorr){

        }
    });
    location.reload();
}
function likeReply(id){
    $.ajax({
        url: "/likeReply",
        type: "POST",
        data: {reply_id: id, url: window.location.pathname},
        success: function (response){
        },
        error: function (error){
            if(error.responseText == 'AlreadyLiked'){
                alert("You already liked this comment.");
            }
        }
    });
    location.reload();
}

$(function() {
    $("#post_content img, .resizablebox").each(function() {
        var oImgWidth = $(this).width();
        var oImgHeight = $(this).height();
        // alert(oImgWidth + "= " + oImgHeight);
        $(this).css({
            'max-width':oImgWidth+'px',
            'max-height':'auto',
            'width':'100%',
            'height':'100%'
        });
    });
});

$(function(){


    $("#commentParentSubmit").click(function( event ) {
        var pName = $("#commentParentName");
        var pPassword = $("#commentParentPassword");
        var pText = $("#commentParentText");
           
        if($.trim(pName.val()) == ""){
            alert("이름을 입력하세요.");
            pName.focus();
            return;
        }else if($.trim(pPassword.val()) == ""){
            alert("패스워드를 입력하세요.");
            pPassword.focus();
            return;
        }else if($.trim(pText.val()) == ""){
            alert("내용을 입력하세요.");
            pText.focus();
            return;
        }
           
        $.ajax({
            url: "/reply",
            type: "POST",
            data: {name: pName.val(), password: pPassword.val(), contents: pText.val(), url: window.location.pathname},
            success: function(returned){
                $("#commentParentName").val("");
                $("#commentParentPassword").val("");
                $("#commentParentText").val("");
            },
            error: function() {
            }
        });
        location.reload();
    });
});