import time
import requests
from typing import Dict, Any, Optional

token = "" # Your Cycle API token
graphql_endpoint = "https://api.product.cycle.app/graphql"
workspace_id= ""
feedback_doctype_id = ""
MAX_RETRIES = 3
values = [
    {
        "id": "QXR0cmlidXRlVGV4dFZhbHVlXzhkY2I0MDQ0LTlkMDNGY2NC04YWIwLWI5ZmMzNGQ0ZTBlMA==",
        "value": "Mobile",
        "customerEmails": ["john@email.com", "jane@email.com"],
    },
    {
        "id": "QXR0cmlidXRlVGV4dFZhbHVlX2NkMWFkYzk0A1ODQtNGY3NC04YzIwLTM1YmI3NjVhMWQwZQ==",
        "value": "Security",
        "customerEmails": ["eric@email.com", "sara@email.com"],
    },
    {
        "id": "QXR0cmlidXRlVGV4dFZhbHVlXzZmZjUzMTI1LWMWMtNDgxYy1iM2MxLWZkMTQyYjI5OGMyOQ==",
        "value": "Payment",
        "customerEmails": ["paul@email.com", "anne@email.com"],
    },
    {
        "id": "QXR0cmlidXRlVGV4dFZhbHVlXzcwMjQ1MzFiLTMwMzktNiOS1hNDE0LWM5MjExOGU5NGEwNg==",
        "value": "Core",
        "customerEmails": ["emil@email.com", "lucy@email.com"],
    },
]

def delay(ms: int):
    time.sleep(ms / 1000)

def query_cycle(query: str, variables: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    attempt = 0

    while attempt < MAX_RETRIES:
        try:
            attempt += 1
            if attempt > 1:
                print(f"Attempt {attempt} to fetch data from {graphql_endpoint}")

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}" if token else "",
            }
            response = requests.post(
                graphql_endpoint,
                json={"query": query, "variables": variables},
                headers=headers,
            )

            if response.status_code == 200:
                return response.json()
            else:
                print("❌ Error fetching Cycle, trying again…")
                if attempt >= MAX_RETRIES:
                    response.raise_for_status()
        except requests.RequestException as error:
            print(f"Attempt {attempt} failed due to error:", error)
            if attempt >= MAX_RETRIES:
                raise error

        delay(1000)

    return None

def fetch_workspace_id(slug: str) -> Optional[str]:
    query = """
        query workspaceBySlug($slug: DefaultString!) {
            getProductBySlug(slug: $slug) {
                id
            }
        }
    """
    variables = {"slug": slug}
    response = query_cycle(query, variables)
    return response.get("data", {}).get("getProductBySlug", {}).get("id") if response else None

def read_doc_with_reporter_and_doc_type_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    query = """
    query fetchDoc($docId: ID!) {
        node(id: $docId) {
            ... on Doc {
                id
                title
                doctype {
                    id
                    name
                }
                assignee {
                    id
                    email
                    firstName
                    lastName
                }
            }
        }
    }
    """
    
    variables = {
        "docId": doc_id
    }
    
    response = query_cycle(query, variables)
    return response.get("data", {}).get("node") if response else None

def update_doc_select_attribute(doc_id: str, attribute_definition_id: str, select_value_id: str) -> Optional[Dict[str, Any]]:
    query = """
    mutation UpdateDocSelectAttribute(
        $docId: ID!,
        $attributeDefinitionId: ID!,
        $value: DocAttributeValueInput!
    ) {
        changeDocAttributeValue(
            docId: $docId,
            attributeDefinitionId: $attributeDefinitionId,
            value: { select: $value.select }
        ) {
            __typename
            ... on DocAttributeNumber {
                id
                value {
                    __typename
                    id
                    value
                }
            }
        }
    }
    """

    variables = {
        "docId": doc_id,
        "attributeDefinitionId": attribute_definition_id,
        "value": {
            "select": select_value_id
        }
    }

    response = query_cycle(query, variables)
    return response.get("data", {}).get("changeDocAttributeValue") if response else None

def on_doc_created(payload: Dict[str, Any]):
    try:
        if payload["type"] != "doc.create":
            print("Not a doc creation event")
            return

        if payload["productId"] != workspace_id:
            print("Not a doc from the right workspace")
            return

        doc = read_doc_with_reporter_and_doc_type_by_id(payload["id"])

        if doc.get("doctype", {}).get("name") != "Feedback":
            print("Not a feedback")
            return

        value = next(
            (v for v in values if doc["assignee"]["email"] in v["customerEmails"]),
            None
        )

        if not value:
            print("No value found for the reporter email")
            return

        updated_doc_response = update_doc_select_attribute({
            "attributeDefinitionId": config["propertyDefinitionId"],
            "docId": payload["id"],
            "selectValueId": value["id"]
        })

        print("Doc property updated", updated_doc_response.get("id"))
    except Exception as e:
        print("Error in catch")
        print(e)


# This is a example payload that you will receive from the webhook
on_doc_created({
    "type": "doc.create",
    "id": "RG9jXzVlY2FjN2I5LTBmMDItNDYxNS05YzRkLTgwZGEzNmQxMTY0ZQ==", # Doc id
    "productId": workspace_id, # Product id
    "doctypeId": feedback_doctype_id # Doc type id
})
