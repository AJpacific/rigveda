const AUDIO_LOAD_ICON = `<span class="fa fa-hourglass"></span>`;
const AUDIO_NORMAL_ICON = `<span class="fa fa-volume-up"></span>`;
const AUDIO_PLAYING_ICON = `<span class="fa fa-stop"></span>`;

function ProgressBarScrollCallback() {
    let winScroll = document.body.scrollTop || document.documentElement.scrollTop,
        height = document.documentElement.scrollHeight - document.documentElement.clientHeight,
        scrolled = (winScroll / height);

    /* Since we have disabled scroll bars, we will display the scroll position as a line on the top of the page. */
    if (scrolled <= 0) {
        $(".progress-container").fadeOut();
    }
    else {
        $(".progress-container").fadeIn();
        document.getElementById("progressBar").style.width = (scrolled * 100) + "%";
    }
}

function PlayHymnAudio()
{
    var audio_element = document.getElementById('hymn_audio');
    if(!audio_element.paused)
    {
        audio_element.pause();
        audio_element.currentTime = 0;
        $('#play_hymn_button').html(AUDIO_NORMAL_ICON);
    }
    else {
        audio_element.play();
        $('#play_hymn_button').html(AUDIO_PLAYING_ICON);
    }
}

$(document).ready(() => {
    /* Hide the progress bar */
    $(".progress-container").hide();
    var n_stanzas = document.getElementsByClassName('card').length;
    var stanza_height = document.getElementsByClassName('card')[0].offsetHeight;

    /* Inject a compact meta line into navbar: Stanzas */
    try {
        var navbar = document.getElementById('navbar');
        if (navbar && n_stanzas > 0) {
            var metaEl = document.createElement('div');
            metaEl.id = 'navbar_meta_compact';
            metaEl.style.fontFamily = 'Garamond';
            metaEl.style.fontSize = '12px';
            metaEl.style.color = 'rgb(111, 106, 99)';
            metaEl.style.marginTop = '2px';
            metaEl.style.textAlign = 'center';
            var nowVerse = '—';
            /* Initially show first card footer value if available */
            var firstFooter = document.querySelector('.card .card-footer');
            if (firstFooter && firstFooter.innerText) {
                nowVerse = firstFooter.innerText.trim();
            }
            metaEl.innerHTML = `Stanzas: <span style="color: rgb(138, 75, 45); font-weight:600;">${n_stanzas}</span>`;
            navbar.appendChild(metaEl);

            /* Add a thin row above the progress bar for Now playing on the left */
            var progressContainer = document.querySelector('.progress-container');
            if (progressContainer) {
                var nowRow = document.createElement('div');
                nowRow.style.display = 'flex';
                nowRow.style.alignItems = 'center';
                nowRow.style.justifyContent = 'space-between';
                nowRow.style.gap = '8px';
                nowRow.style.padding = '0 8px';
                nowRow.style.height = '16px';
                var nowLeft = document.createElement('div');
                nowLeft.style.fontFamily = 'Garamond';
                nowLeft.style.fontSize = '11px';
                nowLeft.style.color = 'rgb(111, 106, 99)';
                nowLeft.innerHTML = `Now playing: <span id="navbar_meta_now" style="color: rgb(138, 75, 45); font-weight:600;">${nowVerse}</span>`;
                var spacer = document.createElement('div');
                spacer.style.flex = '1';
                nowRow.appendChild(nowLeft);
                nowRow.appendChild(spacer);
                progressContainer.parentNode.insertBefore(nowRow, progressContainer);
            }
        }
    } catch {}

    document.addEventListener('scroll', () => {
        ProgressBarScrollCallback();
    });

    var audio_element = document.getElementById('hymn_audio');
    audio_element.addEventListener('loadstart', () => {
        $('#play_hymn_button').html(AUDIO_LOAD_ICON)
    });

    audio_element.addEventListener('canplaythrough', () => {
        $('#play_hymn_button').html(AUDIO_NORMAL_ICON);
    });

    audio_element.addEventListener('ended', () => {
        $('#play_hymn_button').html(AUDIO_NORMAL_ICON);
        audio_element.currentTime = 0;
    });

    /* Scroll while playing audio */
    audio_element.ontimeupdate = function () {
        var percent_scroll = audio_element.currentTime / audio_element.duration;
        var index = Math.floor(percent_scroll * n_stanzas);
        window.scrollTo(0, stanza_height * index);
        /* Update compact Now: verse number based on nearest visible card footer */
        try {
            var footers = document.querySelectorAll('.card .card-footer');
            if (footers && footers.length > index && index >= 0) {
                var nowEl = document.getElementById('navbar_meta_now');
                if (nowEl) nowEl.innerText = footers[index].innerText.trim();
            }
        } catch {}
    }

});