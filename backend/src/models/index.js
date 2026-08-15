/**
 * Requiring each model file here registers its schema with Mongoose
 * (mongoose.model(name, schema) runs on require). Populate calls that
 * reference a model only by ref-name string (e.g. `.populate('assignment')`)
 * need that model registered *somewhere* in the process before they run —
 * importing this file once at startup guarantees all of them are, regardless
 * of which controller/service happens to populate which ref first.
 */
require('./User');
require('./Course');
require('./Enrollment');
require('./Assignment');
require('./Submission');
require('./AttendanceRecord');
require('./AdvisorNote');
require('./Alert');
require('./Recommendation');
require('./ChatMessage');
