import sys
import json
from pymongo import MongoClient

# MongoDB Atlas connection information
MONGODB_URI = "mongodb+srv://bhagyabijlaney:pass123@cluster0.xesty4x.mongodb.net/"  # Replace with your MongoDB Atlas connection URI
DATABASE_NAME = "BloodBank"
COLLECTION_NAME = "inventory"

# MongoDB Atlas client setup
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

def add_inventory(new_item):
    # Insert the new item into MongoDB collection
    result = collection.insert_one(new_item)
    return result.inserted_id

def update_inventory(item_name, updated_item):
    # Update the item in MongoDB collection
    result = collection.update_one({"bloodGroup": item_name}, {"$set": updated_item})
    if result.matched_count > 0:
        return updated_item
    else:
        return None

def delete_inventory(item_name):
    # Delete the item from MongoDB collection
    result = collection.delete_one({"bloodGroup": item_name})
    return result.deleted_count > 0

# Main function
def main():
    method = sys.argv[1]
    args = sys.argv[2]

    if method == "addInventory":
        args = json.loads(args)
        result = add_inventory(args)
    elif method == "updateInventory":
        args = json.loads(args)
        item_name, updated_item = args["bloodGroup"], args
        result = update_inventory(item_name, updated_item)
    elif method == "deleteInventory":
        item_name = args
        result = delete_inventory(item_name)
    else:
        print("Invalid method.")

    # Print the result as JSON
    print(json.dumps(result))

if __name__ == "__main__":
    main()
