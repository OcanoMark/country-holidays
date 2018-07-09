// Global variables
var currYear = new Date().getFullYear();
var weekdays = [];
weekdays["sunday"] = 0;
weekdays["monday"] = 1;
weekdays["tuesday"] = 2;
weekdays["wednesday"] = 3;
weekdays["thursday"] = 4;
weekdays["friday"] = 5;
weekdays["saturday"] = 6;

// On ready function
$(function() {
    // URL where country list will be obtained
    var countryListUrl = "https://www.officeholidays.com/countries/index.php";

    // Obtain raw html data
    $.getJSON("https://allorigins.me/get?url=" + encodeURIComponent(countryListUrl))

        // Success function
        .done(function(data) {
            // Obtain and sanitize countries table
            var table = data.contents
                .match(/<table class="info-table" width="100%">([\s\S]*?)<\/table>/)[0]
                .replace(/<img src/g, "<img source");

            // Iterate over and obtain each country record
            $(table).find("tbody tr td a").each(function() {

                // Build contents of country combobox
                $("#country").append("<option value='" + $(this).attr("href").split("/")[0] +
                    "'>" + this.textContent.trim() +
                    "</option>");
            });

            $("#country-loader").hide();
            $("select#country").attr("disabled", false);
            $("#fetch-button").attr("disabled", false);
        })

        // Called when there is error
        .fail(function() {
            displayError();
        });
});

// Obtain available record / years of the selected country
$("#country").on("change", function() {
    // URL where year list will be obtained
    var yearListUrl = "https://www.officeholidays.com/countries/" + $("#country").val();

    // Reset year selector
    $("#year")
        .attr("disabled", true)
        .empty()
        .append("<option value=''>Current year</option>");
    $("#year-loader").show();

    // Obtain raw html data
    $.getJSON("https://allorigins.me/get?url=" + encodeURIComponent(yearListUrl))

        // Success function
        .done(function(data) {
            // Obtain and sanitize year combobox
            var select = data.contents
                .match(/<form name="form2" id="form2" class="styled-select-left">([\s\S]*?)<\/form>/)[0];
            var years = [];

            // Iterate over and obtain each available year
            $(select).find("select option").each(function() {
                if (!isNaN(this.textContent)) {
                    years.push(this.textContent);
                }
            });

            // Include current year as the second entry
            years.splice(1, 0, currYear);

            // Build contents of year combobox
            $.each(years, function(i, d) {
                $('#year').append("<option value='" + d + "'>" + d + "</option>");
            });

            $("#year").attr("disabled", false);
            $("#year-loader").hide();
        })

        // Called when there is error
        .fail(function() {
            displayError();
        });
});

// Triggered when submit button is clicked
$("form").submit(function(e) {
    e.preventDefault();

    // Initialize variables
    var website = $("#website").val();
    var country = $("#country").val();
    var selectedCountry = $("#country")[0][$("#country")[0].selectedIndex].text;
    var year = ($("#year").val() == "") ? currYear : $("#year").val();
    var url = website + "/countries/" + country + "/" + year + ".php";

    // Prevent submission when country variable is an empty string
    if (country == "") {
        return false;
    }

    // Show loader beside the submit button
    $("#fetch-loader").show();

    // Obtain raw html data
    $.getJSON("https://allorigins.me/get?url=" + encodeURIComponent(url))

        // Success function
        .done(function(data) {
            // Obtain and sanitize holiday table
            var table = data.contents
                .match(/<table class="list-table">([\s\S]*?)<\/table>/)[0];

            var headers = [];
            var holidays = [];

            // Iterate over the table head and obtain headers
            $(table).find("thead tr th").each(function() {
                headers.push(this.textContent.trim());
            });
            // Add "Category" to the headers array
            headers.push("Category");

            // Iterate over the table body rows
            $(table).find("tbody tr").each(function() {
                var arr = [];

                // Iterate over each cell in a row
                $(this).find("td").each(function(i, d) {
                    $(this).find("time").remove();
                    arr.push(this.textContent.trim());
                });

                // Obtain holiday category
                arr.push($(this).attr("class"));
                holidays.push(arr);
            });

            // Hide loader when data is ready
            $("#fetch-loader").hide();

            // Display holiday records
            displayTable(headers, holidays, selectedCountry, year);
        })

        // Called when there is error
        .fail(function() {
            displayError();
        });
});

// Display holiday records in a datatable
function displayTable(headers, holidays, country, year) {

    // Destroy previous datatale
    if ($.fn.DataTable.isDataTable("#holiday-table")) {
        $("#holiday-table").DataTable().destroy();
    }

    // Update table information
    $("#table-caption").html("Displaying " + year + " holidays of " + country);
    $("#regional-div").show();

    // Create datatable
    $("#holiday-table")
        .DataTable({
            "autoWidth": false,
            "order": [],
            dom: "Blfrtip",
            data: holidays,
            "columns": [
            	{ "title": headers[0] },
                { "title": headers[1] },
                { "title": headers[2] },
                { "title": headers[3] },
                { "title": headers[4] }
            ],
            columnDefs: [
                { targets: [0], type: "weekday" },
                { targets: [1], type: "date" },
                { targets: [4], visible: false }
            ],
            buttons: [
                "copyHtml5",
                "excelHtml5",
                "csvHtml5",
                "pdfHtml5"
            ]
        });

    // Called when datatable is drawn
    centerPagination();
}

// Regional checkbox listener
$("#regional").on("change", function() {
    // Redraw datatable
    $("#holiday-table").DataTable().draw();

    // Called when datatable is drawn
    centerPagination();
});

// Dynamically center datatable pagination
function centerPagination() {
    var width = $("#holiday-table_wrapper .dataTables_paginate ul.pagination").width();
    $("#holiday-table_wrapper .dataTables_paginate").width(width);
}

// Display error message
function displayError() {
    // Delay error reporting in cases like when page is refreshed immediately upon loading
    setTimeout(function() {
        if (confirm("Cannot establish connection to the web! Click OK to refresh page.")) {
            location.reload();
        }
    }, 1000);
}

// Extend DataTable JS functions

// Include / exclude regional holidays
$.fn.dataTableExt.afnFiltering.push(function(oSettings, aData, iDataIndex) {
    return ($("#regional")[0].checked) ? true :  aData[4] != "regional";
});

// Exclude hidden columns from search
$.fn.dataTable.ext.search.push(
    function(settings, data, dataIndex) {
        // Always return true if search is blank (save processing)
        if (settings.oPreviousSearch.sSearch === "") return true;
 
        var search = $.fn.DataTable.util.escapeRegex(settings.oPreviousSearch.sSearch);
        var newFilter = data.slice();
 
        for (var i = 0; i < settings.aoColumns.length; i++) {
            if (!settings.aoColumns[i].bVisible) {
                newFilter.splice(i, 1);
            }
        }
 
        var regex = new RegExp("^(?=.*?" + search + ").*$", "i");
        return regex.test(newFilter.join(" "));
    }
);

// Custom datatable sorting for weekdays
$.extend($.fn.dataTableExt.oSort, {
    "weekday-asc": function (a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        return ((weekdays[a] < weekdays[b]) ? -1 : ((weekdays[a] > weekdays[b]) ? 1 : 0));
    },
    "weekday-desc": function (a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        return ((weekdays[a] < weekdays[b]) ? 1 : ((weekdays[a] > weekdays[b]) ? -1 : 0));
    }
});