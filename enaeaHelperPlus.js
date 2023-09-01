// ==UserScript==
// @name         enaeaHelperPlus
// @namespace    http://tampermonkey.net/
// @version      0.4
// @license      MIT
// @description  make your life easier
// @author       SQHome-Jin
// @match        https://study.enaea.edu.cn/circleIndexRedirect.do*
// @match        https://study.enaea.edu.cn/viewerforccvideo.do*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at:      document-start
// ==/UserScript==

(function () {
    'use strict';
    let currentPagePath = window.location.pathname;
    let continuePlay = setInterval(continuePlayVideo, 3000);
    let continueChapter = setInterval(findAndStartChapter, 3000);
    let continueLesson = setInterval(clickNextPageButton, 3000);
    let pageLoading = false;
    let currentPageComplete = true;
    let playbackSpeed = 4; // Recommended speed: 2-4

    if (isContentsPage()) {
        continuePlayVideo();
        sleep(2000).then(() => {
            pageLoading = false;
            GM_setValue("baseUrl", window.location.href);
            findAndStartLesson();
        });
    }

    if (isLessonPage()) {
        sleep(2000).then(() => {
            pageLoading = false;
            findAndStartChapter();
        });
    }

    function findAndStartLesson() {
        let incompleteLessonIndex = findIncompleteLesson();
        if (incompleteLessonIndex >= 0) {
            startNextLesson(incompleteLessonIndex);
            clearInterval(continueLesson);
        } else {
            currentPageComplete = true;
        }
    }

    function findIncompleteLesson() {
        let progressValueList = document.querySelectorAll(".progressvalue");
        for (let i = 0; i < progressValueList.length; i++) {
            if (progressValueList[i].innerText !== '100%') {
                return i;
            }
        }
        return -1;
    }

    function startNextLesson(index) {
        pageLoading = true;
        currentPageComplete = false;
        let goLearnList = document.querySelectorAll(".golearn.ablesky-colortip.saveStuCourse");
        sleep(1000).then(() => {
            window.location.href = 'https://study.enaea.edu.cn' + getLeassonUrl(goLearnList[index].getAttribute("data-vurl"));
        });
    }

    function getLeassonUrl(dataUrl) {
        if (dataUrl.startsWith("/")) {
            return dataUrl;
        } else {
            return "/" + dataUrl;
        }
    }

    function findAndStartChapter() {
        let currentChapter = document.querySelector(".current.cvtb-MCK-course-content");
        if (currentChapter) {
            let currentChapterProgress = currentChapter.querySelector(".cvtb-MCK-CsCt-studyProgress");
            if (currentChapterProgress && currentChapterProgress.innerText === "100%") {
                let incompleteChapterIndex = findIncompleteChapter();
                if (incompleteChapterIndex >= 0) {
                    startNextChapter(incompleteChapterIndex);
                } else {
                    completeCurrentLesson();
                }
            }
        }
    }

    function findIncompleteChapter() {
        let progressValueList = document.querySelectorAll(".cvtb-MCK-CsCt-studyProgress");
        for (let i = 0; i < progressValueList.length; i++) {
            if (progressValueList[i].innerText !== '100%') {
                return i;
            }
        }
        return -1;
    }

    function startNextChapter(index) {
        let courseInfoList = document.querySelectorAll(".cvtb-MCK-CsCt-info.clearfix");
        courseInfoList[index].click();
        let chapterTitle = document.querySelectorAll(".cvtb-MCK-CsCt-title.cvtb-text-ellipsis")[index].innerText;
        continuePlayVideo();
        sleep(300).then(() => {
            console.log('Start learn: ' + chapterTitle);
            let continueButton = document.getElementById("ccH5jumpInto");
            if (continueButton !== null) {
                continueButton.click();
            }
        });
    }

    function completeCurrentLesson() {
        let lessonTitle = document.querySelector(".cvtb-top-link.cvtb-text-ellipsis").innerHTML;
        console.log('This leason is completed: ' + lessonTitle);
        let baseUrl = GM_getValue('baseUrl', '');
        pageLoading = true;
        window.location.href = baseUrl;
        clearInterval(continueChapter);
        clearInterval(continuePlay);
    }

    function continuePlayVideo() {
        if (isLessonPage()) {
            let video = $('video')[0];
            if (video) {
                video.muted = true;
                video.playbackRate = parseInt(playbackSpeed);
                if (video.paused) {
                    video.play();
                }
            }
            closePausePopup();
        }
    }

    function clickNextPageButton() {
        if (isContentsPage() && !isLastPage() && currentPageComplete && !pageLoading) {
            console.log('Current page complete, go to next page');
            nextPage();
            sleep(2000).then(() => {
                findAndStartLesson();
            });
        }
    }

    function isContentsPage() {
        return currentPagePath === '/circleIndexRedirect.do' && testURL('action', 'toNewMyClass') && testURL('type', 'course');
    }

    function isLessonPage() {
        return currentPagePath === '/viewerforccvideo.do';
    }

    function nextPage() {
        document.getElementsByClassName("next paginate_button")[0].click();
    }

    function isLastPage() {
        return document.getElementsByClassName("next paginate_button paginate_button_disabled")[0];
    }

    function closePausePopup() {
        let pauseButton = document.getElementsByClassName("td-content");

        if (pauseButton.length !== 0) {
            console.log('Pause button found');
            $("button:contains('Continue Learning')").click();
            $(".dialog-content input").click(); // Answer options
            $(".dialog-button-container button").click(); // Answer dialog
        } else {
            console.log('Pause button not found');
        }

    }

    function testURL(name, value) {
        let queryParams = window.location.search.substring(1);
        let variableList = queryParams.split("&");

        for (const element of variableList) {
            let parameterPair = element.split("=");

            if (parameterPair[0] === name) {
                return parameterPair[1] === value;
            }
        }

        return false;
    }

    function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
})();
