<?php
	$website = "https://calendarific.com/api/v2";
	$apiKey = "***api key goes here***";
	$params = $_GET["params"];
	
	if (isset($params)) {
		$url = "";
		
		if ($params["get"] == "countries") {
			$url = $website . "/countries?api_key=" . $apiKey;
		} else { //holidays
			$url = $website . "/holidays?api_key=" . $apiKey . "&country=" .
				$params["country"] . "&year=" . $params["year"];
		}
		
		$response = file_get_contents($url);
		echo $response;
	}
?>
