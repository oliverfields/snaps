#!/usr/bin/python3

# API endpoint to add/update/delete posts

LOG = '/home/5/p/phnd/snaps.phnd.net/log.txt'
IMAGES_DIR = '/home/5/p/phnd/snaps.phnd.net/images'
THUMBNAIL_WIDTH = '200'
LARGE_WIDTH = '600'
JSON_FEED = '/home/5/p/phnd/snaps.phnd.net/feed.json'

import cgi, sys, os
from pathlib import Path
import cgitb; cgitb.enable()
import uuid
import json


def log(msg):
	with open(LOG, "a") as f:
		f.write(msg+'\n')


def prepend_json_feed(post):
	"""
	Add post details to start of json feed

    Requires Python 3.7+ because relies on dictionary keeping order
	"""

	new_post = {
		'caption': post['caption'],
		'id': post['id'],
		'originalExtension': post['image_original'].partition('.')[2]
	}

	with open(JSON_FEED) as f:
		feed = json.load(f)

	# Add new post first in feed
	feed['feed'] = [ new_post ] + feed['feed']

	with open(JSON_FEED, 'w') as f:
		json.dump(feed, f, indent=2)


def save_post_image(post_id, form_image):
	"""
	Save file from form to disk and create post thumbnail
	"""
	sys.path.insert(0, os.getcwd())

    # Create dir if not exists
	Path(IMAGES_DIR).mkdir(parents=True, exist_ok=True)

	# Write original image to disk
	file_extension_original = form_image.filename.partition('.')[2].lower()
	file_name_original = post_id + '-original.' + file_extension_original
	open(IMAGES_DIR + '/' + file_name_original, 'wb').write(form_image.file.read())

	# Create thumbnail
	file_extension_thumb = 'png'
	file_name_thumbnail = post_id + '-thumbnail.' + file_extension_thumb
	cmd = "convert '" + IMAGES_DIR + '/' + file_name_original + "' -resize " + THUMBNAIL_WIDTH + " '" + IMAGES_DIR + '/' + file_name_thumbnail + "'"
	os.system(cmd)

	# Create large
	file_extension_large = 'png'
	file_name_large = post_id + '-large.' + file_extension_large
	cmd = "convert '" + IMAGES_DIR + '/' + file_name_original + "' -resize " + LARGE_WIDTH + " '" + IMAGES_DIR + '/' + file_name_large + "'"
	os.system(cmd)

	return {
		'original': file_name_original,
		'thumbnail': file_name_thumbnail,
		'large': file_name_large
	}


def put_request():
	"""
	Create new post, uploading files and updating post list

	HTTP request:
	Content-Type: multipart/form-data
	Authorization: xxxx

	image -> image file, acceptable files are >10mb and jpg, png or gif
	title -> post title
	"""

	try:
		post = {
			'id': uuid.uuid4().hex,
			'caption': form['caption'].value
		}

		post_files = save_post_image(post['id'], form['image'])

		post['image_original'] = post_files['original']
		post['image_thumbnail'] = post_files['thumbnail']
		post['image_large'] = post_files['large']

		prepend_json_feed(post)

		print('Status: 200 OK')
		print('Content-type: text/plain')
		print('')
		print(json.dumps(post))

	except Exception as e:
		log('Exception: ' + str(e))
		fail_request()


def post_request():
	"""
	Update post, uploading files and updating post list
	"""

	print('''Status: 200 OK
Content-type: text/plain

POST''')


def delete_request():
	"""
	Delete post and its files
	"""

	print('''Status: 200 OK
Content-type: text/plain

DELETE''')


def fail_request():
	"""
	Crash and burn
	"""

	print('''Status: 500 Internal Server Error
Content-type: text/plain

FAIL:\n''')
	for k, v in os.environ.items():
		print(k + ': ' + v)

	print(form)

form = cgi.FieldStorage()

if os.environ['REQUEST_METHOD'] == 'PUT':
	put_request()
elif os.environ['REQUEST_METHOD'] == 'POST':
	post_request()
elif os.environ['REQUEST_METHOD'] == 'DELETE':
	delete_request()
# Fail if request type is none of the above
else:
	fail_request()

"""
form = cgi.FieldStorage()
print('Content-type: text/html')
sys.path.insert(0, os.getcwd())

message = None

# Test if the file is loaded for the upload
if 'filename' in form:
    fileitem = form['filename']
    fn = os.path.basename(fileitem.filename)
    open('/home/5/p/phnd/www/' + fn, 'wb').write(fileitem.file.read())
    message = 'The file "' + fn + '" was uploaded successfully'
else:
    message = 'No file was uploaded'
"""
replyhtml = """
<html>
<body>
<form enctype="multipart/form-data" action="ul.cgi" method="post">
<p>File: <input type="file" name="filename" /></p>
<p><input type="submit" value="Upload" name=action/></p>
</form>
<p>%s</p>
</body>
</html>
"""
#print(replyhtml % message)