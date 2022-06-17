#!/usr/bin/python3

# API endpoint to add/update/delete posts

LOG = '/home/5/p/phnd/snaps.phnd.net/log.txt'
IMAGES_DIR = '/home/5/p/phnd/snaps.phnd.net/images'
THUMBNAIL_WIDTH = '600'
JSON_FEED = '/home/5/p/phnd/snaps.phnd.net/feed.json'

import cgi, sys, os, glob
from pathlib import Path
import cgitb; cgitb.enable()
import uuid
import json
import datetime


def log(msg):
	t = datetime.datetime.now()
	with open(LOG, "a") as f:
		f.write(str(t) + '\t' + msg + '\n')


def prepend_json_feed(post):
	"""
	Add post details to start of json feed
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


def update_json_feed(post):
	"""
	Update existing post details in json feed
	"""

	log('Updateing feed with post:')
	feedUpdate = False

	with open(JSON_FEED) as f:
		feed = json.load(f)

	# Update feed with updated post
	for p in feed['feed']:
		if p['id'] == post['id']:
			# Only caption and originalExtension may change, all other values remain the same
			if 'caption' in post.keys():
				if p['caption'] != post['caption']:
					p['caption'] = post['caption']
					feedUpdate = True
			if 'originalExtension' in post.keys():
				if p['originalExtension'] != post['originalExtension']:
					p['originalExtension'] = post['originalExtension']
					feedUpdate = True

	if feedUpdate:
		with open(JSON_FEED, 'w') as f:
			json.dump(feed, f, indent=2)

	return post


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
	cmd = "convert '" + IMAGES_DIR + '/' + file_name_original + "' -auto-orient -resize " + THUMBNAIL_WIDTH + " '" + IMAGES_DIR + '/' + file_name_thumbnail + "'"
	os.system(cmd)

	return {
		'original': file_name_original,
		'thumbnail': file_name_thumbnail,
		'originalExtension': file_name_original.partition('.')[2]
	}


def put_request():
	"""
	Create new post, uploading files and updating post list

	HTTP request:
	Content-Type: multipart/form-data
	Authorization: xxxx

	image -> image file, acceptable files are >10mb and jpg, png or gif, mandatory
	caption -> post title, mandatory
	"""

	try:
		post = {
			'id': uuid.uuid4().hex,
			'caption': form['caption'].value
		}

		post_files = save_post_image(post['id'], form['image'])

		post['imageOriginal'] = post_files['original']
		post['imageThumbnail'] = post_files['thumbnail']

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

	HTTP request:
	Content-Type: multipart/form-data
	Authorization: xxxx

    id -> post id, mandatory
	image -> image file, acceptable files are >10mb and jpg, png or gif, optional
	caption -> post caption, optional
	"""


	try:
		post = {
			'id': form['id'].value
		}

		if 'image' in form.keys():
			log('Updateing image ' + post['id'])
			post_files = save_post_image(post['id'], form['image'])
			post['imageOriginal'] = post_files['original']
			post['originalExtension'] = post_files['originalExtension']
			post['imageThumbnail'] = post_files['thumbnail']

		if 'caption' in form.keys():
			post['caption'] = form['caption'].value

		updated_post = update_json_feed(post)

		print('Status: 200 OK')
		print('Content-type: text/plain')
		print('')
		print(json.dumps(post))

	except Exception as e:
		log('Exception: ' + str(e))
		fail_request()


def delete_request():
	"""
	Delete post from feed and remove any files

	HTTP request:
	Content-Type: multipart/form-data
	Authorization: xxxx

	id -> post id, mandatory
	"""

	try:
		feed_updated = False

		# Remove from feed
		with open(JSON_FEED) as f:
			feed = json.load(f)

		# Add new post first in feed
		for list_id, post in enumerate(feed['feed']):
			if post['id'] == form['id'].value:
				log('Match feed found, deleting post at position ' + str(list_id))
				feed['feed'].pop(list_id)
				feed_updated = True

		if feed_updated:
			with open(JSON_FEED, 'w') as f:
				json.dump(feed, f, indent=2)

		# Remove files
		for f in glob.glob(IMAGES_DIR + "/" + form['id'].value + "*"):
			log("Deleting: " + f)
			os.remove(f)

		print('Status: 200 OK')
		print('Content-type: text/plain')
		print('')

	except Exception as e:
		log('Exception: ' + str(e))
		fail_request()


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
