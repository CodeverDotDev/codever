<html>
<body>
${kcSanitize(msg("passwordResetBodyFirstSentenceHtml"))?no_esc}
${kcSanitize(msg("passwordResetBodyClickLinkHtml",linkExpirationFormatter(linkExpiration), link ))?no_esc}
${kcSanitize(msg("passwordResetBodyIgnoreMessageHtml"))?no_esc}
</body>
<footer>
    <div style="display:flex;justify-content: center;margin-top: 3rem;">
        <figure class="panel-image">§
            <img src="https://i.ibb.co/NLt7Nv6/codever-keycloak-logo-background-180x46.png">
        </figure>
    </div>
</footer>
</html>
