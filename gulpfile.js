var gulp = require("gulp");
var webpack = require("gulp-webpack");
var watch = require("gulp-watch");
var http = require("http");
var st = require("st");
var path = require("path");
var s3 = require("gulp-awspublish");
var config = require("./package.json");

gulp.task("deploy", function() {

	var publisher = s3.create({
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		region: process.env.AWS_REGION,
		params: {
			Bucket: process.env.AWS_BUCKET
		}
	});

	var headers = {
    'Cache-Control': 'max-age=0, no-transform, public',
		'Metadata' : {
			"commit": process.env.CI_COMMIT_ID,
			"build-url": process.env.CI_BUILD_URL,
			"build-number": process.env.CI_BUILD_NUMBER,
			"committer-name": process.env.CI_COMMITTER_NAME,
			"committer-email": process.env.CI_COMMITTER_EMAIL,
			"committer-username": process.env.CI_COMMITTER_USERNAME,
			"message": process.env.CI_MESSAGE
		}
  };

  return gulp.src(['./dist/*'])
     // gzip, Set Content-Encoding headers and add .gz extension
    // .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers))

    // create a cache file to speed up consecutive uploads
    // .pipe(publisher.cache())

     // print upload updates to console
    .pipe(s3.reporter());
});



gulp.task("html", function() {
  return gulp.src("./*.html")
  .pipe(gulp.dest("dist"));
  //.pipe(livereload());
});

gulp.task("webpack", function() {
  return gulp.src("src/entry.js")
  .pipe(webpack(require("./webpack.config.js")))
  .pipe(gulp.dest("dist/"));
  //.pipe(livereload());
});

gulp.task("server", function(done) {
  http.createServer(
    st({ path: path.join(__dirname, "/dist"), index: "index.html", cache: false })
  ).listen(3000, done);
});

gulp.task("build", ["html", "webpack"]);

gulp.task("watch", [ "server" ], function() {
  //livereload.listen({ basePath: "dist" });
  gulp.watch("./*.jsx", [ "webpack" ]);
  gulp.watch("./*.js", [ "webpack" ]);
  gulp.watch("./*.css", [ "webpack" ]);
  gulp.watch("./*.html", [ "html" ]);
	gulp.watch("./dist/*", ["deploy"]);
});

gulp.task("default", function() {
  gulp.start("watch");
});
