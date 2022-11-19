<html>
<body>
${kcSanitize(msg("emailVerificationWelcomeHtml"))?no_esc}
${kcSanitize(msg("emailVerificationClickLinkHtml",link,  linkExpirationFormatter(linkExpiration)))?no_esc}
${kcSanitize(msg("emailVerificationTipHtml"))?no_esc}
${kcSanitize(msg("emailVerificationSincerelyHtml"))?no_esc}
${kcSanitize(msg("emailVerificationPsHtml"))?no_esc}
</body>
<footer>
    <div style="display:flex;justify-content: center;margin-top: 3rem;">
        <figure class="panel-image">
            <img src="https://i.ibb.co/NLt7Nv6/codever-keycloak-logo-background-180x46.png">
        </figure>
    </div>
</footer>
</html>
