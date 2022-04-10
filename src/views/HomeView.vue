<template>
    <div>
        <hello-world />
    </div>
</template>

<script>
import HelloWorld from "../components/HelloWorld";

export default {
    mounted() {
        this.handleClientLoad();
    },
    name: "Home-page",

    components: {
        HelloWorld,
    },
    data() {
        return {
            DISCOVERY_DOCS: [
                "https://sheets.googleapis.com/$discovery/rest?version=v4",
                "https://content.googleapis.com/discovery/v1/apis/drive/v3/rest",
            ],
            SCOPES: [
                "https://www.googleapis.com/auth/spreadsheets.readonly",
                "https://www.googleapis.com/auth/drive",
                "https://www.googleapis.com/auth/drive.appdata",
                "https://www.googleapis.com/auth/drive.file",
                "https://www.googleapis.com/auth/drive.metadata",
                "https://www.googleapis.com/auth/drive.metadata.readonly",
                "https://www.googleapis.com/auth/drive.photos.readonly",
                "https://www.googleapis.com/auth/drive.readonly",
            ],
        };
    },
    methods: {
        handleClientLoad() {
            gapi.load("client:auth2", this.initClient);
        },
        initClient() {
            gapi.client
                .init({
                    apiKey: process.env.VUE_APP_API_KEY,
                    clientId: process.env.VUE_APP_CLIENT_ID,
                    discoveryDocs: this.DISCOVERY_DOCS,
                    scope: this.SCOPES.join(" "),
                })
                .then(
                    () => {
                        // Listen for sign-in state changes.
                        gapi.auth2
                            .getAuthInstance()
                            .isSignedIn.listen(this.updateSigninStatus);

                        // Handle the initial sign-in state.
                        this.updateSigninStatus(
                            gapi.auth2.getAuthInstance().isSignedIn.get()
                        );
                    },
                    (error) => {
                        console.log(JSON.stringify(error, null, 2));
                    }
                );
        },
        updateSigninStatus(isSignedIn) {
            if (isSignedIn) {
                this.$store.state.gapi.authorized = true;
                this.listSheets();
            } else {
                this.$store.state.gapi.authorized = false;
            }
        },
        listSheets() {
            gapi.client.drive.files
                .list({
                    q: "mimeType='application/vnd.google-apps.spreadsheet'",
                    fields: "nextPageToken, files(id, name)",
                })
                .then(
                    (response) => {
                        let files = response.result.files;
                        files.forEach((file) => {
                            file.url =
                                "https://docs.google.com/spreadsheets/d/" +
                                file.id +
                                "/";
                        });
                        this.$store.state.gapi.sheets = files;
                    },
                    (err) => {
                        console.error("Execute error", err);
                    }
                );
        },
        appendPre(message) {
            // var pre = document.getElementById("content");
            // var textContent = document.createTextNode(message + "\n");
            // pre.appendChild(textContent);
            console.log(message);
        },
    },
};
</script>
