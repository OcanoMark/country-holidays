// Global variables
var url = "holidays.php";
var currYear = new Date().getFullYear();
var weekdays = [];

// Sort days of the week
weekdays["sunday"] = 0;
weekdays["monday"] = 1;
weekdays["tuesday"] = 2;
weekdays["wednesday"] = 3;
weekdays["thursday"] = 4;
weekdays["friday"] = 5;
weekdays["saturday"] = 6;

// Get name of day
weekdays[0] = "Sunday";
weekdays[1] = "Monday";
weekdays[2] = "Tuesday";
weekdays[3] = "Wednesday";
weekdays[4] = "Thursday";
weekdays[5] = "Friday";
weekdays[6] = "Saturday";

$(function() {
	for (var i = currYear + 2; i > currYear - 6; i--) {
		$('#year').append(new Option(i, i));
	}
	
	// Get available countries
	var params = {
		"params" : {
			get : "countries"
		}
	}
	$.getJSON(url, params)
		.done(function(data) {
			var countries = data["response"]["countries"];
			$(countries).each(function() {
				$('#country').append(
					new Option(this["country_name"], this["iso-3166"])
				);
			});
			
			$("#country-loader").hide();
            $("#country").attr("disabled", false);
			$("#year").attr("disabled", false);
		})
		.fail(function() {
            displayError();
        });
});

// Enable / dsiable fetch button
$("#country").on("change", function() {
	$("#fetch-button")
		.attr("disabled", (this.value == "" || $('#year').val() == ""));
});

// Enable / dsiable fetch button
$("#year").on("change", function() {
	$("#fetch-button")
		.attr("disabled", (this.value == "" || $('#country').val() == ""));
});

// Obtain holiday records
$("form").submit(function(e) {
    e.preventDefault();
	$("#fetch-loader").show();
	
	var params = {
		"params" : {
			"get" : "holidays",
			"country" : $('#country').val(),
			"year" : $("#year").val()
		}
	}
	$.getJSON(url, params)
		.done(function(data) {
			if (data["meta"]["code"] == 200) {
				var holidays = data["response"]["holidays"];
				var headers = ["Day", "Date", "Holiday Name", "Description", "Category"];
				var rows = [];
		
				$(holidays).each(function() {
					if (this["type"] == "Season" || this["type"] == "Weekend" ||
						this["name"] == "Additional Special Non-Working Day") {
						return;
					}
					
					var arr = [];
					var day = new Date(this["date"]["iso"]).getDay();
					
					arr.push(weekdays[day]);
					arr.push(this["date"]["iso"]);
					arr.push(this["name"]);
					arr.push(this["description"]);
					arr.push(this["type"]);
					rows.push(arr);
				});
				
				$("#fetch-loader").hide();
				var country = $("#country").find('option:selected').text();
				var year = $("#year").find('option:selected').text();

				// Display holiday records
				displayTable(headers, rows, country, year);
				
			} else {
				displayError();
			}
		})
		.fail(function() {
            displayError();
        });
});

// Display holiday records in a datatable
function displayTable(headers, holidays, country, year) {
	var exportOpt = { columns: [0, ':visible'] };

    if ($.fn.DataTable.isDataTable("#holiday-table")) {
        $("#holiday-table").DataTable().destroy();
    }

    $("#table-caption").html("Displaying " + year + " holidays of " + country);
    $("#regional-div").show();

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

// Shows / hide regional holidays
$("#regional").on("change", function() {
    $("#holiday-table").DataTable().draw();
});

// Display error message
function displayError() {
    setTimeout(function() {
        if (confirm("Oops! Something went wrong.")) {
            location.reload();
        }
    }, 1000);
}

// Extend DataTableJS functions

// Include / exclude regional holidays
$.fn.dataTableExt.afnFiltering.push(function(oSettings, aData, iDataIndex) {
	var isRegional = aData[4].indexOf("Common local holiday") == -1;
    return ($("#regional")[0].checked) ? true : isRegional;
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
