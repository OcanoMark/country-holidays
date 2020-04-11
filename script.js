// Global variables
var website = $("#website").val();
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
	var url = website + "/countries/";

	// Obtain html markup
	$.ajax({
		url: "holidays.php",
		type: "GET",
		data: { url: url },
		success: function(data) {
			// Obtain countries list
			var dom = $(data).find("div.thirteen.columns div.four.columns li a");
				
			// Iterate over and build country dropdown list
			$(dom).each(function() {
				$('#country').append(new Option(this.textContent.trim(),
					$(this).attr("href").replace(url, "")));
			});

			$("#country-loader").hide();
			$("select#country").attr("disabled", false);
		},
		error: function() {
			displayError();
		}
	});
});

// Obtain available record / years of the selected country
$("#country").on("change", function() {
	// URL where year list will be obtained
	var url = website + "/countries/" + $("#country").val()
	
    // Reset year selector
    $("#year").attr("disabled", true).empty();
	$('#year').append(new Option("Select a year", ""));
	$("#fetch-button").attr("disabled", true);
	
	if (this.value == "")
		return;
	
    $("#year-loader").show();
	
	// Obtain html markup
	$.ajax({
		url: "holidays.php",
		type: "GET",
		data: { url: url },
		success: function(data) {
			// Obtain year list
			dom = $(data).find("select.year option");
			
			// Iterate over and build country dropdown list
			$(dom).each(function() {
				$('#year').append(new Option(this.textContent.trim(),
					$(this).attr("value").replace("/", "")));
			});
			
			$("#year option:nth-child(2)").remove();
            $("#year").attr("disabled", false);
            $("#year-loader").hide();
		},
		error: function() {
			displayError();
		}
	});
});

$("#year").on("change", function() {
	$("#fetch-button").attr("disabled", (this.value == ""));
});

// Triggered when submit button is clicked
$("form").submit(function(e) {
    e.preventDefault();

    // Initialize variables
    var country = $("#country").val();
    var selectedCountry = $("#country option:selected").text();
    var year = ($("#year").val() == "") ? currYear : $("#year").val();
    var url = website + "/countries/" + country + "/" + year;

    // Show loader beside the submit button
    $("#fetch-loader").show();
	
	// Obtain html markup
	$.ajax({
		url: "holidays.php",
		type: "GET",
		data: { url: url },
		success: function(data) {
			// Obtain holiday table
			table = $(data).find("table.country-table");
			
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
		},
		error: function() {
			displayError();
		}
	});
});

// Display holiday records in a datatable
function displayTable(headers, holidays, country, year) {
	var exportOpt = { columns: [0, ':visible'] };

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
				{
					extend: 'copyHtml5',
					exportOptions: exportOpt
				}, {
					extend: 'excelHtml5',
					exportOptions: exportOpt
				}, {
					extend: 'csvHtml5',
					exportOptions: exportOpt
				}, {
					extend: 'pdfHtml5',
					exportOptions: exportOpt
				}
            ]
        });
}

// Regional checkbox listener
$("#regional").on("change", function() {
    // Redraw datatable
    $("#holiday-table").DataTable().draw();
});

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
    return ($("#regional")[0].checked) ? true :  aData[3] != "Regional Holiday";
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