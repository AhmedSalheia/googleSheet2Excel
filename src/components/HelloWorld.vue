<template>
    <div class="page">
        <v-container class="w-100 h-100">
            <v-row class="h-100">
                <v-card elevation="3" class="mx-auto w-100 p-4 h-100" rounded>
                    <v-form
                        v-model="valid"
                        class="text-center"
                        style="min-height: 25%"
                        @submit.prevent
                    >
                        <v-col col="12">
                            <v-text-field
                                label="Google Sheet URL"
                                :rules="rules"
                                hide-details="auto"
                                v-model="sheet_url"
                            ></v-text-field>
                        </v-col>
                        <v-alert
                            v-if="OpDetails.message !== ''"
                            dense
                            text
                            :type="OpDetails.type"
                            class="mb-3"
                        >
                            {{ OpDetails.message }}
                        </v-alert>
                        <v-btn
                            class="ml-3"
                            color="success"
                            v-if="valid"
                            @click="generateXLSX"
                        >
                            Generate Excel File
                        </v-btn>
                    </v-form>

                    <v-col
                        col="12"
                        class="overflow-y-auto mb-3"
                        style="height: 60%"
                    >
                        <v-list dense v-if="$store.state.gapi.authorized">
                            <v-subheader>Your Sheets</v-subheader>
                            <v-list-item-group
                                v-model="selectedItem"
                                color="primary"
                                v-if="sheets.length > 0"
                            >
                                <v-list-item
                                    v-for="(item, i) in sheets"
                                    :key="i"
                                >
                                    <v-list-item-icon>
                                        <v-icon>{{
                                            item.icon || "mdi-file-chart"
                                        }}</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content>
                                        <v-list-item-title
                                            v-text="item.name"
                                            :value="item.id"
                                        ></v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list-item-group>
                            <div
                                v-else
                                class="h-100 w-100 d-flex justify-center align-items-center"
                            >
                                You Don't Have Any Sheets
                            </div>
                        </v-list>
                        <div
                            v-else
                            class="h-100 w-100 d-flex justify-center align-items-center"
                        >
                            Please Login To Get Your Google Sheets Here
                        </div>
                    </v-col>

                    <v-col col="12">
                        <v-btn
                            v-if="!$store.state.gapi.authorized"
                            @click="handleAuthClick"
                            class="w-100"
                            color="error"
                        >
                            <v-icon class="mr-2">mdi-google</v-icon>
                            Authorize
                        </v-btn>
                        <v-btn
                            v-else
                            @click="handleSignoutClick"
                            class="w-100"
                            color="error"
                        >
                            <v-icon class="mr-2">mdi-logout-variant</v-icon>

                            Log out
                        </v-btn>
                    </v-col>
                </v-card>
            </v-row>
        </v-container>
    </div>
</template>

<script>
import { utils, writeFileXLSX } from "xlsx";

export default {
    name: "HelloWorld",

    data() {
        return {
            valid: false,
            sheet_url: "",
            sheet_id: "",
            rules: [
                (value) => !!value || "Required.",
                (value) =>
                    /^((https:\/\/)*)docs.google.com\/spreadsheets\/d\/[a-zA-Z0-9]+\//.test(
                        value
                    ) || "Please Provide A Valid Google Sheet URL",
            ],
            items: [],
            OpDetails: {
                message: "",
                type: "",
            },
            OpTimeout: null,
            selectedItem: null,
        };
    },
    computed: {
        sheets() {
            return this.$store.state.gapi.sheets;
        },
    },
    methods: {
        generateXLSX() {
            this.OpDetails = {
                message: "Getting Sheet Data",
                type: "info",
            };
            console.log(this.sheet_id !== "");
            this.listMajors(
                this.sheet_id !== ""
                    ? this.sheet_id
                    : this.getId(this.sheet_url)
            );
        },
        getId: (url) => {
            return /d\/[a-zA-Z0-9]+/.exec(url)[0].replace("d/", "");
        },
        listMajors(id) {
            this.OpDetails = {
                message: "Extracting Data From Sheet",
                type: "warning",
            };
            gapi.client.sheets.spreadsheets.values
                .get({
                    spreadsheetId: id,
                    range: "A1:ZZZ9999",
                })
                .then(
                    (response) => {
                        var range = response.result;
                        if (range.values.length > 0) {
                            this.download(range.values);
                        } else {
                            this.OpDetails = {
                                message: "Sheet Is Empty",
                                type: "error",
                            };
                        }
                    },
                    () => {
                        this.OpDetails = {
                            message:
                                "Sheets is private or does not exist, Please login if that sheet is private",
                            type: "error",
                        };
                    }
                );
        },
        download(items) {
            this.OpDetails = {
                message: "Generating Excel File",
                type: "warning",
            };
            const data = utils.aoa_to_sheet(items);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, data, "data");
            writeFileXLSX(wb, "demo.xlsx");
            this.OpDetails = {
                message: "File Generated Successfully",
                type: "success",
            };
        },

        handleAuthClick() {
            gapi.auth2.getAuthInstance().signIn();
        },
        handleSignoutClick() {
            gapi.auth2.getAuthInstance().signOut();
        },
    },
    watch: {
        OpDetails() {
            clearInterval(this.OpTimeout);
            this.OpTimeout = setInterval(() => {
                this.OpDetails = {
                    message: "",
                    type: "",
                };
                clearInterval(this.OpTimeout);
            }, 5000);
        },
        selectedItem(newVal, oldVal) {
            let oldSheet = this.$store.state.gapi.sheets[oldVal];
            if (newVal !== undefined) {
                let sheet = this.$store.state.gapi.sheets[newVal];
                this.sheet_id = sheet.id;
                this.sheet_url = sheet.url;
            } else {
                if (
                    this.sheet_url.replace(/[0-9a-zA-Z#&?_=]+$/, "") ===
                    oldSheet.url
                ) {
                    this.sheet_url = "";
                }
                this.sheet_id = "";
            }
        },
        sheet_url(newVal) {
            if (newVal !== "") {
                let sheet = this.sheets.filter(
                    (sheet) =>
                        sheet.url === newVal.replace(/[0-9a-zA-Z#&?_=]+$/, "")
                );
                if (sheet[0] === undefined) {
                    this.sheet_id = "";
                    this.selectedItem = undefined;
                } else {
                    this.sheet_id = sheet[0].id;
                    this.selectedItem = this.sheets.indexOf(sheet[0]);
                }
            } else {
                this.sheet_url = "";
                this.sheet_id = "";
                this.selectedItem = undefined;
            }
        },
    },
};
</script>

<style lang="css" scoped>
div.page {
    position: absolute;
    width: 80%;
    height: 60%;
    top: 20%;
    left: 10%;
}
</style>
