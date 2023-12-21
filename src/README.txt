Everything related to creating seams in production code goes in seams/

Everything related to test-time utilities goes in control/

control/ is allowed to depend on seams/ but not vice-verca. This separation is important, as it's what makes this library tree-shaking friendly.
