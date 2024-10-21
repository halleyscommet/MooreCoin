var allowedKeys = {
    84: 't',
    82: 'r',
    65: 'a',
    78: 'n',
    83: 's',
    32: 'space',
    73: 'i',
    71: 'g',
    72: 'h',
}

var transRights = ['t', 'r', 'a', 'n', 's', 'space', 'r', 'i', 'g', 'h', 't', 's'];

var transRightsPosition = 0;

document.addEventListener('keydown', function (e) {
    var key = allowedKeys[e.keyCode];
    var requiredKey = transRights[transRightsPosition];

    if (key == requiredKey) {
        transRightsPosition++;

        if (transRightsPosition == transRights.length) {
            transRightsPosition = 0;

            document.body.style.backgroundImage = "url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Transgender_Pride_flag.svg/255px-Transgender_Pride_flag.svg.png')";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundSize = "cover";
        }
    } else {
        transRightsPosition = 0;
    }
});