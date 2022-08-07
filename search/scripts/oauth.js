document.addEventListener("readystatechange", function () {
    if (document.readyState === "complete") {
        let oauthImg = document.querySelector(".oauth-login");
        if (!oauthConfig.enable) {
            oauthImg.parentElement.removeChild(oauthImg);
            return;
        } else {
            OAuth.checkTokenValid((err, result) => {
                if (err) {
                    console.error(err);
                    Swal.fire({
                        title: "Unauthorized, Click OK to redirect to login page.",
                        showCancelButton: true
                    }).then((result) => {
                        if (result.isConfirmed) {
                            OAuth.redirectToLoginPage();
                        }
                    });
                } else oauthImg.parentElement.removeChild(oauthImg);
            });
        }
        oauthImg.onclick = OAuth.redirectToLoginPage;
    }
});
