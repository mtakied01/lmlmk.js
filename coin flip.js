var playWaiting = false,
    accountBalance = 0;

function validateBetMessage(bet) {
    var parsedBet = parseInt(bet);

    if (isNaN(parsedBet) || !isFinite(bet) || bet % 1 !== 0 )
        return "Not a valid number.";

    if (parsedBet > accountBalance)
        return "Balance insufficient for bet.";

    if (parsedBet < 1)
        return "Bet below game minimum.";

    if (parsedBet > 50000)
        return "Bet above game maximum.";

    return "ok";
}

function playAgain() {
    $('#play-again').hide();

    flipBack($('#play-again').attr('side'));
    $("#result").delay(550).fadeOut(200, function () {
        $("#betCoins").fadeIn(200, function () {
        });
    });

    return false;
}

function maskBet() {
    var valid = "0123456789",
        strVal = $('#bet').val();
    if (valid.indexOf(strVal.substring(strVal.length - 1, strVal.length)) == "-1")
        $('#bet').val(strVal.substring(0, strVal.length - 1));

    validateBet();
}

function validateBet() {
    var bet = $('#bet').val();

    var ok = validateBetMessage(bet);
    if (ok != 'ok') {
        $("#betError").html(ok);
        return false;
    }
    $("#betError").html('');

    return true;
}

function flipFlip(side, top) {
    $('#flip-' + side).css('background-position', '0px ' + top + 'px');
}

function flipResult(side) {
    var top    = 0,
        height = 300,
        time   = 0;

    $('#flip-activated').hide();

    $('#flip-' + side).css('background-position', '0px 0px')
    $('#flip-' + side).show();

    for (var i = 0; i <= 12; i++) {
        time = time + 80;
        setTimeout("flipFlip('" + side + "'," + top + ");", time);
        top = top - height;
    }
}

function flipBack(side) {
    var top    = -3600,
        height = 300,
        time   = 0;

    $('#flip-activated').hide();

    for (var i = 0; i <= 12; i++) {
        time = time + 80;
        top = top + height;
        setTimeout("flipFlip('" + side + "'," + top + ");", time);
    }

    setTimeout("$('#flip-standing').show();", time)
}

$(document).ready(function () {

    $('#bet').keyup(maskBet);
    $('#play-again').delegate('a', 'click', playAgain);


    accountBalance = parseInt($('.selectedBalance').html().replace(/\D/g, ''));
    validateBet();


    $(document).delegate('.playGameLink', 'click', function (e) {
        e.preventDefault();

        // if we already have an ajax request pending, then don't try again
        if (playWaiting)
            return;

        // parse the bet
        var bet   = $('#bet').val(),
            guess = $(this).attr('data-value'),
            url   = $(this).attr('href');

        bet = parseInt(bet);

        if (!validateBet(bet))
            return;

        // Wait for completion.  Disallows multiple invisible bets.
        playWaiting = true;

        // Fade the coins out and show the "flipping" text
        var fadeDuration = 200;

        $('#flip-standing').hide();
        $('#flip-activated').show();

        $('.selectedBalance').html("<b>"+(accountBalance-bet)+"</b> BAPs Available"); //DEDUCT BET FROM BALANCE


        $("#betCoins").fadeOut(fadeDuration, function () {
            $("#result").html('You called, "' + guess.toUpperCase() + '!"');
            $("#result").show();
        });

        $.ajax({
            url: url,
            type: 'post',
            data: {
                bet: bet,
                guess: guess
            },
            dataType: 'json',
            success: function (data) {
                //$('#flipActivated').hide();
                if (data.error) {

                    $("#result").html('data.err_msg');
                    $("#result").show();
                    $('#play-again').show();
                    $('#flipStanding').show();
                    alert(data.err_msg);
                } else {
                    flipResult(data.side);

                    $('#play-again').attr('side', data.side);
                    $("#result").delay(550).hide();
                    $("#result").html(data.resultHTML);
                    $("#result").fadeIn(fadeDuration, function () {

                        $('.selectedBalance').html("<b>"+(data.accountBalance)+"</b> BAPs Available"); //ADD PAYOUT

                        accountBalance = parseInt(data.accountBalance);

                        $('#totalPlays').html(Number(data["plays"]).toNumber());
                        $('#totalPrizes').html(Number(data["prizes"]).toNumber());
                        $('.lastPlays').html(data.latestPlays);

                        $('#play-again').show();
                        playWaiting = false;
                    });
                }
            },
            error:function (jqXHR, textStatus, errorThrown) {
                console.log("AJAX error:" + textStatus );
                $('#result').html(errorThrown);
            },
            complete:function () {
                playWaiting = false;
                validateBet();
            }
        });
    })
});
